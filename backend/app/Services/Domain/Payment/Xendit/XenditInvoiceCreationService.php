<?php

namespace HiEvents\Services\Domain\Payment\Xendit;

use HiEvents\DomainObjects\XenditPaymentDomainObject;
use HiEvents\Exceptions\Xendit\CreateInvoiceFailedException;
use HiEvents\Repository\Interfaces\XenditPaymentsRepositoryInterface;
use HiEvents\Services\Domain\Order\OrderApplicationFeeCalculationService;
use HiEvents\Services\Domain\Payment\Xendit\DTOs\CreateInvoiceRequestDTO;
use HiEvents\Services\Domain\Payment\Xendit\DTOs\CreateInvoiceResponseDTO;
use Illuminate\Config\Repository;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Client\Factory as HttpClientFactory;
use Psr\Log\LoggerInterface;
use Throwable;

class XenditInvoiceCreationService
{
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly Repository $config,
        private readonly XenditPaymentsRepositoryInterface $xenditPaymentsRepository,
        private readonly DatabaseManager $databaseManager,
        private readonly OrderApplicationFeeCalculationService $orderApplicationFeeCalculationService,
        private readonly HttpClientFactory $httpClientFactory,
    ) {
    }

    /**
     * @throws CreateInvoiceFailedException
     * @throws Throwable
     */
    public function createInvoice(
        CreateInvoiceRequestDTO $invoiceDTO
    ): CreateInvoiceResponseDTO {
        try {
            $this->databaseManager->beginTransaction();

            $applicationFee = $this->orderApplicationFeeCalculationService->calculateApplicationFee(
                accountConfiguration: $invoiceDTO->account->getConfiguration(),
                order: $invoiceDTO->order,
            )->toMinorUnit();

            // Generate unique external ID for idempotency
            $randomSuffix = bin2hex(random_bytes(4));
            $externalId = 'order_' . $invoiceDTO->order->getShortId() . '_' . time() . '_' . $randomSuffix;

            // Generate invoice ID (will be replaced with Xendit API response later)
            $invoiceId = 'inv_' . $invoiceDTO->order->getShortId() . '_' . time() . '_' . $randomSuffix;

            // Prepare invoice payload
            $invoicePayload = [
                'external_id' => $externalId,
                'amount' => $invoiceDTO->amount->toMinorUnit() / 100, // Xendit expects amount in full units
                'payer_email' => $invoiceDTO->order->getEmail(),
                'description' => 'Event: ' . $invoiceDTO->order->getEventId() . ' - Order: ' . $invoiceDTO->order->getShortId(),
                'invoice_duration' => 86400, // 24 hours
                'currency' => $invoiceDTO->currencyCode,
                'items' => [
                    [
                        'name' => 'Event Tickets',
                        'quantity' => 1,
                        'price' => $invoiceDTO->amount->toMinorUnit() / 100,
                    ]
                ],
                'customer' => [
                    'given_names' => $invoiceDTO->order->getFullName(),
                    'email' => $invoiceDTO->order->getEmail(),
                ],
                'fees' => $applicationFee ? [
                    [
                        'type' => 'PLATFORM_FEE',
                        'value' => $applicationFee / 100,
                    ]
                ] : [],
            ];

            $this->logger->debug('Creating Xendit invoice', [
                'externalId' => $externalId,
                'amount' => $invoiceDTO->amount->toMinorUnit() / 100,
                'orderId' => $invoiceDTO->order->getId(),
            ]);

            // Create invoice in database first (will be updated with Xendit response)
            $xenditPayment = $this->xenditPaymentsRepository->create([
                XenditPaymentDomainObject::ORDER_ID => $invoiceDTO->order->getId(),
                XenditPaymentDomainObject::INVOICE_ID => $invoiceId,
                XenditPaymentDomainObject::EXTERNAL_ID => $externalId,
                XenditPaymentDomainObject::AMOUNT => $invoiceDTO->amount->toMinorUnit(),
                XenditPaymentDomainObject::CURRENCY => $invoiceDTO->currencyCode,
                XenditPaymentDomainObject::PAYER_EMAIL => $invoiceDTO->order->getEmail(),
                XenditPaymentDomainObject::DESCRIPTION => $invoicePayload['description'],
                XenditPaymentDomainObject::STATUS => 'PENDING',
            ]);

            // Call Xendit API to create invoice
            $xenditApiKey = $this->config->get('services.xendit.api_key');
            $xenditBaseUrl = $this->config->get('services.xendit.base_url', 'https://api.xendit.co');
            $xenditResponse = $this->httpClientFactory
                ->withBasicAuth($xenditApiKey, '')
                ->post($xenditBaseUrl . '/v2/invoices', $invoicePayload);

            if (!$xenditResponse->successful()) {
                throw new CreateInvoiceFailedException(
                    'Failed to create invoice with Xendit: ' . $xenditResponse->body()
                );
            }

            $xenditData = $xenditResponse->json();
            $invoiceUrl = $xenditData['invoice_url'] ?? null;

            // Update xendit payment with Xendit response data
            $this->xenditPaymentsRepository->updateFromArray($xenditPayment->getId(), [
                XenditPaymentDomainObject::INVOICE_ID => $xenditData['id'] ?? $invoiceId,
                XenditPaymentDomainObject::EXTERNAL_ID => $xenditData['external_id'] ?? $externalId,
                XenditPaymentDomainObject::STATUS => $xenditData['status'] ?? 'PENDING',
            ]);

            $this->databaseManager->commit();

            return new CreateInvoiceResponseDTO(
                invoiceId: $xenditData['id'] ?? $invoiceId,
                externalId: $xenditData['external_id'] ?? $externalId,
                invoiceUrl: $invoiceUrl,
                amount: $invoiceDTO->amount->toMinorUnit(),
                applicationFeeAmount: $applicationFee,
            );
        } catch (Throwable $exception) {
            $this->logger->error("Xendit invoice creation failed: {$exception->getMessage()}", [
                'exception' => $exception,
                'invoiceDTO' => $invoiceDTO->toArray(['account']),
            ]);

            $this->databaseManager->rollBack();

            throw new CreateInvoiceFailedException(
                __('There was an error communicating with the payment provider. Please try again later.')
            );
        }
    }
}
