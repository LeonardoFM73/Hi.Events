<?php

namespace HiEvents\Http\Actions\Common\Webhooks;

use HiEvents\DomainObjects\Enums\PaymentProviders;
use HiEvents\DomainObjects\Generated\OrderDomainObjectAbstract;
use HiEvents\DomainObjects\OrderDomainObject;
use HiEvents\DomainObjects\Status\OrderPaymentStatus;
use HiEvents\DomainObjects\Status\OrderStatus;
use HiEvents\Events\OrderStatusChangedEvent;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\ResponseCodes;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

class MockIncomingWebhookAction extends BaseAction
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        try {
            $orderShortId = $request->input('order_short_id');
            $paymentId = $request->input('payment_id');
            $status = $request->input('status', 'success'); // default success

            if (!$orderShortId) {
                return $this->errorResponse('order_short_id is required', ResponseCodes::HTTP_BAD_REQUEST);
            }

            // Find order by short ID
            /** @var OrderDomainObject $order */
            $order = $this->orderRepository->findFirstWhere([
                OrderDomainObjectAbstract::SHORT_ID => $orderShortId,
            ]);

            if (!$order) {
                return $this->errorResponse('Order not found', ResponseCodes::HTTP_NOT_FOUND);
            }

            // Update order status based on mock payment status
            if ($status === 'success') {
                $this->orderRepository->updateFromArray($order->getId(), [
                    OrderDomainObjectAbstract::STATUS => OrderStatus::COMPLETED->name,
                    OrderDomainObjectAbstract::PAYMENT_STATUS => OrderPaymentStatus::PAYMENT_RECEIVED->name,
                    OrderDomainObjectAbstract::PAYMENT_PROVIDER => PaymentProviders::MOCK->value,
                ]);

                // Reload order with updated data
                $updatedOrder = $this->orderRepository->findById($order->getId());

                // Dispatch order status changed event
                event(new OrderStatusChangedEvent(
                    order: $updatedOrder,
                    sendEmails: true
                ));

                logger()->info('Mock payment webhook processed successfully', [
                    'order_short_id' => $orderShortId,
                    'payment_id' => $paymentId,
                    'status' => $status,
                ]);
            } else {
                // Handle failed payment
                $this->orderRepository->updateFromArray($order->getId(), [
                    OrderDomainObjectAbstract::PAYMENT_STATUS => OrderPaymentStatus::PAYMENT_FAILED->name,
                ]);

                logger()->info('Mock payment webhook processed - payment failed', [
                    'order_short_id' => $orderShortId,
                    'payment_id' => $paymentId,
                    'status' => $status,
                ]);
            }

        } catch (Throwable $exception) {
            logger()?->error('Failed to process mock webhook', [
                'exception' => $exception->getMessage(),
                'trace' => $exception->getTrace(),
            ]);
            return $this->noContentResponse(ResponseCodes::HTTP_BAD_REQUEST);
        }

        return $this->noContentResponse();
    }
}
