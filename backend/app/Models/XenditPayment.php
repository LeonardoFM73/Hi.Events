<?php

namespace HiEvents\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class XenditPayment extends BaseModel
{
    use SoftDeletes;

    protected function getTimestampsEnabled(): bool
    {
        return true;
    }

    protected function getCastMap(): array
    {
        return [
            'payment_details' => 'array',
            'last_error' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    protected function getFillableFields(): array
    {
        return [
            'order_id',
            'invoice_id',
            'external_id',
            'status',
            'amount',
            'currency',
            'payment_method',
            'payment_channel',
            'payer_email',
            'description',
            'payment_details',
            'last_error',
            'paid_at',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
