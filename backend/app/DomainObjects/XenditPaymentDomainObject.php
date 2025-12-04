<?php

namespace HiEvents\DomainObjects;

class XenditPaymentDomainObject extends Generated\XenditPaymentDomainObjectAbstract
{
    private ?OrderDomainObject $order = null;

    public function getOrder(): ?OrderDomainObject
    {
        return $this->order;
    }

    public function setOrder(?OrderDomainObject $order): self
    {
        $this->order = $order;
        return $this;
    }

    /**
     * Check if payment is paid
     */
    public function isPaid(): bool
    {
        return $this->getStatus() === 'PAID';
    }

    /**
     * Check if payment is pending
     */
    public function isPending(): bool
    {
        return $this->getStatus() === 'PENDING';
    }

    /**
     * Check if payment is expired
     */
    public function isExpired(): bool
    {
        return $this->getStatus() === 'EXPIRED';
    }
}
