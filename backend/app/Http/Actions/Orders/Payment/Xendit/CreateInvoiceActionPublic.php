<?php

namespace HiEvents\Http\Actions\Orders\Payment\Xendit;

use HiEvents\Exceptions\Xendit\CreateInvoiceFailedException;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Services\Application\Handlers\Order\Payment\Xendit\CreateInvoiceHandler;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CreateInvoiceActionPublic extends BaseAction
{
    public function __construct(
        private readonly CreateInvoiceHandler $createInvoiceHandler,
    )
    {
    }

    public function __invoke(int $eventId, string $orderShortId): JsonResponse
    {
        try {
            $invoice = $this->createInvoiceHandler->handle($orderShortId);
        } catch (CreateInvoiceFailedException $e) {
            return $this->errorResponse($e->getMessage(), Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->jsonResponse([
            'invoice_id' => $invoice->invoiceId,
            'external_id' => $invoice->externalId,
            'invoice_url' => $invoice->invoiceUrl,
            'amount' => $invoice->amount,
        ]);
    }
}
