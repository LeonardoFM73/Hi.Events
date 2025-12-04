<?php

namespace HiEvents\Services\Domain\Payment\Xendit\DTOs;

readonly class CreateInvoiceResponseDTO
{
    public function __construct(
        public string $invoiceId,
        public string $externalId,
        public ?string $invoiceUrl,
        public int $amount,
        public ?int $applicationFeeAmount = null,
    )
    {
    }
}
