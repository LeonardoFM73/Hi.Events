<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Xendit;

use Brick\Math\Exception\MathException;
use Brick\Math\Exception\NumberFormatException;
use Brick\Math\Exception\RoundingNecessaryException;
use Brick\Money\Exception\UnknownCurrencyException;
use HiEvents\DomainObjects\AccountConfigurationDomainObject;
use HiEvents\DomainObjects\OrderItemDomainObject;
use HiEvents\DomainObjects\Status\OrderStatus;
use HiEvents\DomainObjects\XenditPaymentDomainObject;
use HiEvents\Exceptions\ResourceConflictException;
use HiEvents\Exceptions\UnauthorizedException;
use HiEvents\Exceptions\Xendit\CreateInvoiceFailedException;
use HiEvents\Repository\Eloquent\Value\Relationship;
use HiEvents\Repository\Interfaces\AccountRepositoryInterface;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use HiEvents\Repository\Interfaces\XenditPaymentsRepositoryInterface;
use HiEvents\Services\Domain\Payment\Xendit\DTOs\CreateInvoiceRequestDTO;
use HiEvents\Services\Domain\Payment\Xendit\DTOs\CreateInvoiceResponseDTO;
use HiEvents\Services\Domain\Payment\Xendit\XenditInvoiceCreationService;
use HiEvents\Services\Infrastructure\Session\CheckoutSessionManagementService;
use HiEvents\Values\MoneyValue;
use Throwable;

readonly class CreateInvoiceHandler
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private XenditInvoiceCreationService $xenditInvoiceService,
        private CheckoutSessionManagementService $sessionIdentifierService,
        private XenditPaymentsRepositoryInterface $xenditPaymentsRepository,
        private AccountRepositoryInterface $accountRepository,
    ) {
    }

    /**
     * @param string $orderShortId
     * @return CreateInvoiceResponseDTO
     * @throws CreateInvoiceFailedException
     * @throws MathException
     * @throws NumberFormatException
     * @throws RoundingNecessaryException
     * @throws UnknownCurrencyException
     * @throws Throwable
     */
    public function handle(string $orderShortId): CreateInvoiceResponseDTO
    {
        $order = $this->orderRepository
            ->loadRelation(new Relationship(OrderItemDomainObject::class))
            ->loadRelation(new Relationship(XenditPaymentDomainObject::class, name: 'xendit_payment'))
            ->findByShortId($orderShortId);

        if (!$order || !$this->sessionIdentifierService->verifySession($order->getSessionId())) {
            throw new UnauthorizedException(__('Sorry, we could not verify your session. Please create a new order.'));
        }

        if ($order->getStatus() !== OrderStatus::RESERVED->name || $order->isReservedOrderExpired()) {
            throw new ResourceConflictException(__('Sorry, is expired or not in a valid state.'));
        }

        $account = $this->accountRepository
            ->loadRelation(new Relationship(
                domainObject: AccountConfigurationDomainObject::class,
                name: 'configuration',
            ))
            ->findByEventId($order->getEventId());

        // If we already have a Xendit payment, return it
        if ($order->getXenditPayment() !== null) {
            $existingPayment = $order->getXenditPayment();
            $paymentDetails = $existingPayment->getPaymentDetails() ?? [];
            $invoiceUrl = $paymentDetails['invoice_url'] ?? null;

            // Log what we found in DB
            logger()->debug('DEBUG: Existing Payment Check:', [
                'has_details' => !empty($paymentDetails),
                'invoice_url' => $invoiceUrl ?? 'NULL',
            ]);

            if ($invoiceUrl) {
                return new CreateInvoiceResponseDTO(
                    invoiceId: $existingPayment->getInvoiceId(),
                    externalId: $existingPayment->getExternalId(),
                    invoiceUrl: $invoiceUrl,
                    amount: $existingPayment->getAmount(),
                );
            }

            // If we have a payment record but NO invoice URL, it's a "zombie" record (failed previously).
            // We must delete it to allow re-creation.

            $this->xenditPaymentsRepository->deleteById($existingPayment->getId());

            // Allow flow to continue to create new invoice...
        }

        $invoice = $this->xenditInvoiceService->createInvoice(
            CreateInvoiceRequestDTO::fromArray([
                'amount' => MoneyValue::fromFloat($order->getTotalGross(), $order->getCurrency()),
                'currencyCode' => $order->getCurrency(),
                'account' => $account,
                'order' => $order,
            ])
        );

        return new CreateInvoiceResponseDTO(
            invoiceId: $invoice->invoiceId,
            externalId: $invoice->externalId,
            invoiceUrl: $invoice->invoiceUrl,
            amount: $invoice->amount,
            applicationFeeAmount: $invoice->applicationFeeAmount,
        );
    }
}
