<?php

namespace HiEvents\Services\Domain\Payment\Xendit\EventHandlers;

use Brick\Math\Exception\MathException;
use Brick\Math\Exception\NumberFormatException;
use Brick\Math\Exception\RoundingNecessaryException;
use Brick\Money\Exception\UnknownCurrencyException;
use Carbon\Carbon;
use HiEvents\DomainObjects\Enums\PaymentProviders;
use HiEvents\DomainObjects\Generated\OrderDomainObjectAbstract;
use HiEvents\DomainObjects\OrderDomainObject;
use HiEvents\DomainObjects\OrderItemDomainObject;
use HiEvents\DomainObjects\Status\AttendeeStatus;
use HiEvents\DomainObjects\Status\OrderApplicationFeeStatus;
use HiEvents\DomainObjects\Status\OrderPaymentStatus;
use HiEvents\DomainObjects\Status\OrderStatus;
use HiEvents\DomainObjects\XenditPaymentDomainObject;
use HiEvents\Events\OrderStatusChangedEvent;
use HiEvents\Exceptions\CannotAcceptPaymentException;
use HiEvents\Repository\Eloquent\Value\Relationship;
use HiEvents\Repository\Interfaces\AffiliateRepositoryInterface;
use HiEvents\Repository\Interfaces\AttendeeRepositoryInterface;
use HiEvents\Repository\Interfaces\OrderRepositoryInterface;
use HiEvents\Repository\Interfaces\XenditPaymentsRepositoryInterface;
use HiEvents\Services\Domain\Order\OrderApplicationFeeService;
use HiEvents\Services\Domain\Product\ProductQuantityUpdateService;
use HiEvents\Services\Infrastructure\DomainEvents\DomainEventDispatcherService;
use HiEvents\Services\Infrastructure\DomainEvents\Enums\DomainEventType;
use HiEvents\Services\Infrastructure\DomainEvents\Events\OrderEvent;
use Illuminate\Cache\Repository;
use Illuminate\Database\DatabaseManager;
use Psr\Log\LoggerInterface;
use Throwable;

class InvoicePaidHandler
{
    public function __construct(
        private readonly OrderRepositoryInterface              $orderRepository,
        private readonly XenditPaymentsRepositoryInterface     $xenditPaymentsRepository,
        private readonly AffiliateRepositoryInterface          $affiliateRepository,
        private readonly ProductQuantityUpdateService          $quantityUpdateService,
        private readonly AttendeeRepositoryInterface           $attendeeRepository,
        private readonly DatabaseManager                       $databaseManager,
        private readonly LoggerInterface                       $logger,
        private readonly Repository                            $cache,
        private readonly DomainEventDispatcherService          $domainEventDispatcherService,
        private readonly OrderApplicationFeeService            $orderApplicationFeeService,
    )
    {
    }

    /**
     * @throws Throwable
     */
    public function handleEvent(string $externalId, array $webhookData): void
    {
        if ($this->isPaymentAlreadyHandled($externalId)) {
            $this->logger->info('Xendit payment already handled', [
                'external_id' => $externalId,
            ]);

            return;
        }

        $this->databaseManager->transaction(function () use ($externalId, $webhookData) {
            /** @var XenditPaymentDomainObject $xenditPayment */
            $xenditPayment = $this->xenditPaymentsRepository
                ->loadRelation(new Relationship(OrderDomainObject::class, name: 'order'))
                ->findFirstWhere([
                    XenditPaymentDomainObject::EXTERNAL_ID => $externalId,
                ]);

            if (!$xenditPayment) {
                $this->logger->error('Xendit payment not found when handling invoice paid event', [
                    'external_id' => $externalId,
                    'webhook_data' => $webhookData,
                ]);

                return;
            }

            $this->validatePaymentAndOrderStatus($xenditPayment);

            $this->updateXenditPaymentInfo($webhookData, $xenditPayment);

            $updatedOrder = $this->updateOrderStatuses($xenditPayment);

            $this->updateAttendeeStatuses($updatedOrder);

            $this->quantityUpdateService->updateQuantitiesFromOrder($updatedOrder);

            OrderStatusChangedEvent::dispatch($updatedOrder);

            $this->domainEventDispatcherService->dispatch(
                new OrderEvent(
                    type: DomainEventType::ORDER_CREATED,
                    orderId: $updatedOrder->getId()
                ),
            );

            $this->markPaymentAsHandled($externalId, $updatedOrder);

            $this->storeApplicationFeePayment($updatedOrder, $webhookData);
        });
    }

    private function updateOrderStatuses(XenditPaymentDomainObject $xenditPayment): OrderDomainObject
    {
        $updatedOrder = $this->orderRepository
            ->loadRelation(OrderItemDomainObject::class)
            ->updateFromArray($xenditPayment->getOrderId(), [
                OrderDomainObjectAbstract::PAYMENT_STATUS => OrderPaymentStatus::PAYMENT_RECEIVED->name,
                OrderDomainObjectAbstract::STATUS => OrderStatus::COMPLETED->name,
                OrderDomainObjectAbstract::PAYMENT_PROVIDER => PaymentProviders::XENDIT->value,
            ]);

        // Update affiliate sales if this order has an affiliate
        if ($updatedOrder->getAffiliateId()) {
            $this->affiliateRepository->incrementSales(
                affiliateId: $updatedOrder->getAffiliateId(),
                amount: $updatedOrder->getTotalGross()
            );
        }

        return $updatedOrder;
    }

    private function updateXenditPaymentInfo(array $webhookData, XenditPaymentDomainObject $xenditPayment): void
    {
        $this->xenditPaymentsRepository->updateWhere(
            attributes: [
                XenditPaymentDomainObject::INVOICE_ID => $webhookData['id'] ?? null,
                XenditPaymentDomainObject::STATUS => $webhookData['status'] ?? 'PENDING',
                XenditPaymentDomainObject::PAYMENT_METHOD => $webhookData['payment_method'] ?? null,
                XenditPaymentDomainObject::PAYMENT_CHANNEL => $webhookData['payment_channel'] ?? null,
                XenditPaymentDomainObject::PAID_AT => $webhookData['paid_at'] ?? null,
                XenditPaymentDomainObject::PAYMENT_DETAILS => $webhookData['payment_details'] ?? null,
            ],
            where: [
                XenditPaymentDomainObject::EXTERNAL_ID => $xenditPayment->getExternalId(),
                XenditPaymentDomainObject::ORDER_ID => $xenditPayment->getOrderId(),
            ]);
    }

    /**
     * @throws CannotAcceptPaymentException
     */
    private function validatePaymentAndOrderStatus(XenditPaymentDomainObject $xenditPayment): void
    {
        if (!in_array($xenditPayment->getOrder()?->getPaymentStatus(), [
            OrderPaymentStatus::AWAITING_PAYMENT->name,
            OrderPaymentStatus::PAYMENT_FAILED->name,
        ], true)) {
            throw new CannotAcceptPaymentException(
                __('Order is not awaiting payment. Order: :id',
                    ['id' => $xenditPayment->getOrderId()]
                )
            );
        }

        // Check if order has expired
        if ((new Carbon($xenditPayment->getOrder()?->getReservedUntil()))->isPast()) {
            throw new CannotAcceptPaymentException(
                __('Payment was successful, but order has expired. Order: :id', [
                    'id' => $xenditPayment->getOrderId()
                ])
            );
        }
    }

    private function updateAttendeeStatuses(OrderDomainObject $updatedOrder): void
    {
        $this->attendeeRepository->updateWhere(
            attributes: [
                'status' => AttendeeStatus::ACTIVE->name,
            ],
            where: [
                'order_id' => $updatedOrder->getId(),
                'status' => AttendeeStatus::AWAITING_PAYMENT->name,
            ],
        );
    }

    private function markPaymentAsHandled(string $externalId, OrderDomainObject $updatedOrder): void
    {
        $this->logger->info('Xendit invoice paid event handled', [
            'external_id' => $externalId,
            'order_id' => $updatedOrder->getId(),
        ]);

        $this->cache->put('xendit_payment_handled_' . $externalId, true, 3600);
    }

    private function isPaymentAlreadyHandled(string $externalId): bool
    {
        return $this->cache->has('xendit_payment_handled_' . $externalId);
    }

    private function storeApplicationFeePayment(OrderDomainObject $updatedOrder, array $webhookData): void
    {
        $this->orderApplicationFeeService->createOrderApplicationFee(
            orderId: $updatedOrder->getId(),
            applicationFeeAmountMinorUnit: 0, // Xendit will handle fee calculation
            orderApplicationFeeStatus: OrderApplicationFeeStatus::PAID,
            paymentMethod: PaymentProviders::XENDIT,
            currency: $updatedOrder->getCurrency(),
        );
    }
}
