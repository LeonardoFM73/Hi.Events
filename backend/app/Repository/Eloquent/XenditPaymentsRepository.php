<?php

namespace HiEvents\Repository\Eloquent;

use HiEvents\DomainObjects\XenditPaymentDomainObject;
use HiEvents\Models\XenditPayment;
use HiEvents\Repository\Interfaces\XenditPaymentsRepositoryInterface;

class XenditPaymentsRepository extends BaseRepository implements XenditPaymentsRepositoryInterface
{
    protected function getModel(): string
    {
        return XenditPayment::class;
    }

    public function getDomainObject(): string
    {
        return XenditPaymentDomainObject::class;
    }
}
