<?php

namespace HiEvents\Services\Application\Handlers\Order\Payment\Xendit;

use HiEvents\Services\Domain\Payment\Xendit\DTOs\XenditWebhookDTO;
use HiEvents\Services\Domain\Payment\Xendit\EventHandlers\InvoicePaidHandler;
use Psr\Log\LoggerInterface;
use Throwable;

class IncomingWebhookHandler
{
    public function __construct(
        private readonly InvoicePaidHandler $invoicePaidHandler,
        private readonly LoggerInterface    $logger,
    )
    {
    }

    /**
     * @throws Throwable
     */
    public function handle(array $payload): void
    {
        $this->logger->debug('Received Xendit webhook', [
            'payload' => $payload,
        ]);

        // Validate webhook signature (implement based on Xendit's requirements)
        if (!$this->validateWebhookSignature($payload)) {
            $this->logger->warning('Invalid Xendit webhook signature', [
                'payload' => $payload,
            ]);
            return;
        }

        $eventType = $payload['event_type'] ?? null;
        $externalId = $payload['data']['external_id'] ?? null;

        if (!$externalId) {
            $this->logger->warning('Xendit webhook missing external_id', [
                'payload' => $payload,
            ]);
            return;
        }

        // Handle different event types
        match ($eventType) {
            'invoice.paid' => $this->invoicePaidHandler->handleEvent($externalId, $payload['data'] ?? []),
            'invoice.expired' => $this->logger->info('Invoice expired', ['external_id' => $externalId]),
            'invoice.failed' => $this->logger->warning('Invoice failed', ['external_id' => $externalId]),
            default => $this->logger->debug('Unhandled Xendit event type', ['event_type' => $eventType]),
        };
    }

    private function validateWebhookSignature(array $payload): bool
    {
        // TODO: Implement Xendit webhook signature validation
        // For now, we'll accept all webhooks (not recommended for production)
        // Xendit uses HMAC-SHA256 for signature verification
        return true;
    }
}
