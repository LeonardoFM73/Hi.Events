<?php

namespace HiEvents\Http\Actions\Orders\Payment\Mock;

use HiEvents\Http\Actions\BaseAction;
use Illuminate\Http\JsonResponse;

class CreateMockPaymentActionPublic extends BaseAction
{
    public function __invoke(int $eventId, string $orderShortId): JsonResponse
    {
        // Generate mock payment ID
        $mockPaymentId = 'mock_' . uniqid() . '_' . time();

        return $this->jsonResponse([
            'payment_id' => $mockPaymentId,
            'order_short_id' => $orderShortId,
            'status' => 'pending',
            'message' => 'Mock payment created successfully. Payment will be automatically confirmed.',
            'webhook_url' => url("/public/webhooks/mock?payment_id={$mockPaymentId}&order_short_id={$orderShortId}"),
        ]);
    }
}
