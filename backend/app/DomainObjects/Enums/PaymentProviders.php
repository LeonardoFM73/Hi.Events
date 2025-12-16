<?php

namespace HiEvents\DomainObjects\Enums;

enum PaymentProviders: string
{
    use BaseEnum;

    case STRIPE = 'STRIPE';
    case XENDIT = 'XENDIT';
    case OFFLINE = 'OFFLINE';
}
