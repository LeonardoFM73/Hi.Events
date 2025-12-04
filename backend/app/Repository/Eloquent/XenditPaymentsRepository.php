<?php

namespace HiEvents\Repository\Eloquent;

use HiEvents\DomainObjects\XenditPaymentDomainObject;
use HiEvents\Models\XenditPayment;
use HiEvents\Repository\Interfaces\XenditPaymentsRepositoryInterface;

class XenditPaymentsRepository extends BaseRepository implements XenditPaymentsRepositoryInterface
{
    public function __construct(XenditPayment $model)
    {
        parent::__construct($model);
    }

    protected function getModelClass(): string
    {
        return XenditPayment::class;
    }

    protected function getDomainObjectClass(): string
    {
        return XenditPaymentDomainObject::class;
    }
}
