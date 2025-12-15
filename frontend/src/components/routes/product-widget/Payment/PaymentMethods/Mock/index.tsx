import { useParams } from "react-router";
import { useCreateMockPayment } from "../../../../../../queries/useCreateMockPayment.ts";
import { useGetEventPublic } from "../../../../../../queries/useGetEventPublic.ts";
import { CheckoutContent } from "../../../../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../../../../common/HomepageInfoMessage";
import { t } from "@lingui/macro";
import { eventHomepagePath } from "../../../../../../utilites/urlHelper.ts";
import { LoadingMask } from "../../../../../common/LoadingMask";
import { Event } from "../../../../../../types.ts";
import { useEffect, useRef, useState, useCallback } from "react";
import { orderClientPublic } from "../../../../../../api/order.client";

interface MockPaymentMethodProps {
    enabled: boolean;
    setSubmitHandler: (submitHandler: () => () => Promise<void>) => void;
}

export const MockPaymentMethod = ({ enabled, setSubmitHandler }: MockPaymentMethodProps) => {
    const { eventId, orderShortId } = useParams();
    const {
        data: mockData,
        isFetched: isMockFetched,
        error: mockPaymentError,
    } = useCreateMockPayment(eventId, orderShortId);
    const { data: event } = useGetEventPublic(eventId);

    // State untuk polling payment status
    const [isPolling, setIsPolling] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [pollError, setPollError] = useState("");
    const [pollAttempts, setPollAttempts] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const MAX_POLL_ATTEMPTS = 30; // 30 attempts x 1 second = 30 seconds max
    const POLL_INTERVAL = 1000; // 1 second - cepat karena mock

    const stopPolling = useCallback(() => {
        console.log('[Mock Payment] Stopping polling...');
        setIsPolling(false);
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const checkPaymentStatus = useCallback(async () => {
        if (!eventId || !orderShortId) {
            console.log('[Mock Payment] Skipping: missing eventId or orderShortId');
            return;
        }

        if (isPaid) {
            console.log('[Mock Payment] Skipping: payment already received');
            stopPolling();
            return;
        }

        setPollAttempts(prev => {
            const currentAttempts = prev + 1;

            if (currentAttempts >= MAX_POLL_ATTEMPTS) {
                console.log('[Mock Payment] ⏱️ Max polling attempts reached.');
                stopPolling();
            }

            return currentAttempts;
        });

        try {
            const response = await orderClientPublic.findByShortId(Number(eventId), orderShortId);
            const order = response?.data;
            const paymentStatus = order?.payment_status;
            const orderStatus = order?.status;

            console.log(`[Mock Payment] Attempt ${pollAttempts + 1}/${MAX_POLL_ATTEMPTS} - Payment: ${paymentStatus}, Order: ${orderStatus}`);

            // Cek berbagai kondisi sukses
            if (paymentStatus === 'PAYMENT_RECEIVED' || orderStatus === 'COMPLETED') {
                console.log('[Mock Payment] ✅ Payment received! Stopping polling.');
                setIsPaid(true);
                setPollAttempts(0);
                setIsProcessing(false);
                stopPolling();
            }
        } catch (e) {
            console.error('[Mock Payment] ❌ Error checking payment status:', e);
            console.log('[Mock Payment] Will retry on next interval...');
        }
    }, [eventId, orderShortId, isPaid, pollAttempts, stopPolling]);

    // Trigger auto payment saat component mount
    useEffect(() => {
        if (isMockFetched && mockData && !isProcessing && !isPaid) {
            console.log('[Mock Payment] Auto-triggering payment success...');
            setIsProcessing(true);

            // Trigger webhook untuk auto-success
            const triggerWebhook = async () => {
                try {
                    const webhookUrl = mockData.webhook_url;
                    if (webhookUrl) {
                        // Extract query params from webhook URL
                        const url = new URL(webhookUrl);
                        const paymentId = url.searchParams.get('payment_id');
                        const orderShortIdParam = url.searchParams.get('order_short_id');

                        console.log('[Mock Payment] Triggering webhook...', { paymentId, orderShortIdParam });

                        // Call webhook
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                order_short_id: orderShortIdParam,
                                payment_id: paymentId,
                                status: 'success'
                            })
                        });

                        console.log('[Mock Payment] Webhook triggered, starting polling...');

                        // Start polling untuk cek status
                        setIsPolling(true);
                        setPollAttempts(0);

                        // Delay sedikit sebelum cek pertama
                        setTimeout(() => {
                            checkPaymentStatus();
                            pollingRef.current = setInterval(() => {
                                checkPaymentStatus();
                            }, POLL_INTERVAL);
                        }, 500);
                    }
                } catch (e) {
                    console.error('[Mock Payment] Error triggering webhook:', e);
                    setPollError(t`Failed to process mock payment.`);
                    setIsProcessing(false);
                }
            };

            // Trigger setelah delay kecil untuk UX
            setTimeout(triggerWebhook, 1000);
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [isMockFetched, mockData, isProcessing, isPaid, checkPaymentStatus]);

    // Set submit handler (tidak perlu submit manual, auto-trigger)
    useEffect(() => {
        if (setSubmitHandler && isMockFetched) {
            setSubmitHandler(() => async () => {
                // Mock payment auto-trigger, tidak perlu action dari user
                console.log('[Mock Payment] Submit handler called (auto-processing)');
            });
        }
    }, [isMockFetched, setSubmitHandler]);

    if (!enabled) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    status="warning"
                    message={t`Payments not available`}
                    subtitle={t`Mock payments are not enabled for this event.`}
                    link={eventHomepagePath(event as Event)}
                    linkText={t`Return to Event`}
                />
            </CheckoutContent>
        );
    }

    if (mockPaymentError && event) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    status="error"
                    /* @ts-ignore */
                    message={mockPaymentError.response?.data?.message || t`Something went wrong`}
                    subtitle={t`Please restart the checkout process.`}
                    link={eventHomepagePath(event)}
                    linkText={t`Return to Event`}
                />
            </CheckoutContent>
        );
    }

    if (pollError) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    status="error"
                    message={t`Failed to Process Payment`}
                    subtitle={pollError}
                />
            </CheckoutContent>
        );
    }

    if (isPaid) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    status="success"
                    message={t`Payment Successful!`}
                    subtitle={t`Your mock payment has been processed successfully. Thank you!`}
                />
            </CheckoutContent>
        );
    }

    if (!isMockFetched) {
        return <LoadingMask />;
    }

    return (
        <CheckoutContent>
            <div className="text-center py-8">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{t`Mock Payment (Test Mode)`}</h2>
                    <p className="text-gray-600 mb-4">
                        {t`This is a test payment method for development purposes.`}
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                    <div className="flex items-center justify-center mb-3">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-blue-800 font-semibold mb-2">
                        {isProcessing ? t`Processing payment...` : t`Payment ready`}
                    </p>
                    <p className="text-sm text-blue-700">
                        {t`Payment ID`}: <span className="font-mono text-xs">{mockData?.payment_id}</span>
                    </p>
                </div>

                {isPolling && (
                    <div className="mt-4">
                        <div className="text-blue-700 mb-2">
                            <span>{t`Waiting for payment confirmation...`}</span>
                            {pollAttempts > 0 && (
                                <span className="text-sm text-gray-600 ml-2">
                                    ({pollAttempts}/{MAX_POLL_ATTEMPTS})
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">
                            {t`This usually takes just a few seconds.`}
                        </div>
                    </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                        ⚠️ {t`This is a test payment method. Do not use in production.`}
                    </p>
                </div>
            </div>
        </CheckoutContent>
    );
}
