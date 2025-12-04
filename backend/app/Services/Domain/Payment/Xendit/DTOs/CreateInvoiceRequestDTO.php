<?php

namespace HiEvents\Services\Domain\Payment\Xendit\DTOs;

use HiEvents\DomainObjects\AccountDomainObject;
use HiEvents\DomainObjects\OrderDomainObject;
use HiEvents\Values\MoneyValue;

readonly class CreateInvoiceRequestDTO
{
    public function __construct(
        public MoneyValue $amount,
        public string $currencyCode,
        public AccountDomainObject $account,
        public OrderDomainObject $order,
    )
    {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            amount: $data['amount'],
            currencyCode: $data['currencyCode'],
            account: $data['account'],
            order: $data['order'],
        );
    }

    public function toArray(array $exclude = []): array
    {
        $data = [
            'amount' => $this->amount->getAmount(),
            'currencyCode' => $this->currencyCode,
            'account' => $this->account,
            'order' => $this->order,
        ];

        foreach ($exclude as $key) {
            unset($data[$key]);
        }

        return $data;
    }
}
