<?php

namespace HiEvents\Services\Domain\Payment\Xendit\DTOs;

readonly class XenditWebhookDTO
{
    public function __construct(
        public string $id,
        public string $external_id,
        public string $status,
        public int $amount,
        public ?int $amount_paid = null,
        public ?string $payment_method = null,
        public ?string $payment_channel = null,
        public ?string $paid_at = null,
        public ?array $payment_details = null,
        public ?array $last_error = null,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            external_id: $data['external_id'] ?? '',
            status: $data['status'] ?? 'PENDING',
            amount: (int)($data['amount'] ?? 0),
            amount_paid: isset($data['amount_paid']) ? (int)$data['amount_paid'] : null,
            payment_method: $data['payment_method'] ?? null,
            payment_channel: $data['payment_channel'] ?? null,
            paid_at: $data['paid_at'] ?? null,
            payment_details: $data['payment_details'] ?? null,
            last_error: $data['last_error'] ?? null,
        );
    }
}
