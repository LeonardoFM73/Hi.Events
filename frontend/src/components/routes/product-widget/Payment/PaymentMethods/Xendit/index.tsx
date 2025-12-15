import { useParams } from "react-router";
import { useCreateXenditInvoice } from "../../../../../../queries/useCreateXenditInvoice.ts";
import { useGetEventPublic } from "../../../../../../queries/useGetEventPublic.ts";
import { CheckoutContent } from "../../../../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../../../../common/HomepageInfoMessage";
import { t } from "@lingui/macro";
import { eventHomepagePath } from "../../../../../../utilites/urlHelper.ts";
import { LoadingMask } from "../../../../../common/LoadingMask";
import { Event } from "../../../../../../types.ts";
import { useEffect, useRef, useState, useCallback } from "react";
import { orderClientPublic } from "../../../../../../api/order.client";

interface XenditPaymentMethodProps {
    enabled: boolean;
    setSubmitHandler: (submitHandler: () => () => Promise<void>) => void;
}

export const XenditPaymentMethod = ({ enabled, setSubmitHandler }: XenditPaymentMethodProps) => {
    const { eventId, orderShortId } = useParams();
    const {
        data: xenditData,
        isFetched: isXenditFetched,
        error: xenditPaymentError,
        refetch: refetchXenditInvoice
    } = useCreateXenditInvoice(eventId, orderShortId);
    const { data: event } = useGetEventPublic(eventId);

    // State untuk polling payment status
    const [isPolling, setIsPolling] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [pollError, setPollError] = useState("");
    const [pollAttempts, setPollAttempts] = useState(0);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const MAX_POLL_ATTEMPTS = 120; // 120 attempts x 2 seconds = 4 minutes max
    const POLL_INTERVAL = 2000; // 2 seconds - lebih cepat untuk responsiveness

    const stopPolling = useCallback(() => {
        console.log('[Xendit Polling] Stopping polling...');
        setIsPolling(false);
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        if (isPolling || isPaid) {
            console.log('[Xendit Polling] Polling already active or payment already received');
            return;
        }

        console.log('[Xendit Polling] Starting payment status polling...');
        setIsPolling(true);
        setPollAttempts(0);

        // Cek langsung pertama kali
        checkPaymentStatus();

        // Setup interval polling
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }
        pollingRef.current = setInterval(() => {
            checkPaymentStatus();
        }, POLL_INTERVAL);
    }, [isPolling, isPaid]);

    const checkPaymentStatus = useCallback(async () => {
        if (!eventId || !orderShortId) {
            console.log('[Xendit Polling] Skipping: missing eventId or orderShortId');
            return;
        }

        if (isPaid) {
            console.log('[Xendit Polling] Skipping: payment already received');
            stopPolling();
            return;
        }

        setPollAttempts(prev => {
            const currentAttempts = prev + 1;

            if (currentAttempts >= MAX_POLL_ATTEMPTS) {
                console.log('[Xendit Polling] ⏱️ Max polling attempts reached. Stopping polling.');
                stopPolling();
            }

            return currentAttempts;
        });

        try {
            const response = await orderClientPublic.findByShortId(Number(eventId), orderShortId);
            const order = response?.data;
            const paymentStatus = order?.payment_status;
            const orderStatus = order?.status;

            console.log(`[Xendit Polling] Attempt ${pollAttempts + 1}/${MAX_POLL_ATTEMPTS} - Payment: ${paymentStatus}, Order: ${orderStatus}`);

            // Cek berbagai kondisi sukses
            if (paymentStatus === 'PAYMENT_RECEIVED' || orderStatus === 'COMPLETED') {
                console.log('[Xendit Polling] ✅ Payment received! Stopping polling.');
                setIsPaid(true);
                setPollAttempts(0);
                stopPolling();
            } else {
                console.log(`[Xendit Polling] ⏳ Waiting... Status: ${paymentStatus}`);
            }
        } catch (e) {
            console.error('[Xendit Polling] ❌ Error checking payment status:', e);
            // Jangan stop polling pada error, coba lagi
            console.log('[Xendit Polling] Will retry on next interval...');
        }
    }, [eventId, orderShortId, isPaid, pollAttempts, stopPolling]);

    // Effect untuk mulai polling otomatis saat invoice dibuat
    useEffect(() => {
        if (isXenditFetched && xenditData && !isPolling && !isPaid) {
            console.log('[Xendit] Invoice created, starting polling...');
            startPolling();
        }

        return () => {
            if (pollingRef.current) {
                console.log('[Xendit] Component unmounting, cleaning up polling');
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [isXenditFetched, xenditData, isPolling, isPaid, startPolling]);

    // Effect untuk handle visibility change (user kembali ke tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && xenditData && !isPaid) {
                console.log('[Xendit] Tab became visible, checking payment status...');
                // Langsung cek status saat user kembali ke tab
                checkPaymentStatus();

                // Restart polling jika tidak aktif
                if (!isPolling) {
                    console.log('[Xendit] Restarting polling after tab became visible...');
                    startPolling();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [xenditData, isPaid, isPolling, checkPaymentStatus, startPolling]);

    // Effect untuk handle window focus (alternatif untuk visibility)
    useEffect(() => {
        const handleFocus = () => {
            if (xenditData && !isPaid) {
                console.log('[Xendit] Window focused, checking payment status...');
                checkPaymentStatus();
            }
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [xenditData, isPaid, checkPaymentStatus]);

    useEffect(() => {
        if (setSubmitHandler && isXenditFetched) {
            setSubmitHandler(() => async () => {
                let invoiceUrl = xenditData?.invoice_url;
                if (!invoiceUrl) {
                    const result = await refetchXenditInvoice();
                    invoiceUrl = result.data?.invoice_url;
                }
                if (invoiceUrl) {
                    console.log('[Xendit] Opening payment page in new tab:', invoiceUrl);
                    window.open(invoiceUrl, '_blank', 'noopener');

                    // Mulai polling segera setelah buka tab baru
                    console.log('[Xendit] Starting polling after opening payment page...');
                    startPolling();
                }
            });
        }
    }, [xenditData, isXenditFetched, setSubmitHandler, refetchXenditInvoice, startPolling]);

    if (!enabled) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    status="warning"
                    message={t`Payments not available`}
                    subtitle={t`Xendit payments are not enabled for this event.`}
                    link={eventHomepagePath(event as Event)}
                    linkText={t`Return to Event`}
                />
            </CheckoutContent>
        );
    }

    if (xenditPaymentError && event) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    status="error"
                    /* @ts-ignore */
                    message={xenditPaymentError.response?.data?.message || t`Something went wrong`}
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
                    message={t`Gagal Mengecek Status Pembayaran`}
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
                    message={t`Pembayaran berhasil!`}
                    subtitle={t`Pembayaran Anda telah diterima. Terima kasih!`}
                />
            </CheckoutContent>
        );
    }

    if (!isXenditFetched) {
        return <LoadingMask />;
    }
    return (
        <CheckoutContent>
            <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">{t`Xendit Payment`}</h2>
                <p className="text-gray-600 mb-6">
                    {t`You will be redirected to Xendit to complete your payment.`}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        {t`Invoice ID`}: <span className="font-mono">{xenditData?.invoice_id}</span>
                    </p>
                    <p className="text-sm text-blue-800 mt-2">
                        {t`Amount`}: <span className="font-bold">{xenditData?.amount}</span>
                    </p>
                </div>
                {isPolling && (
                    <div className="mt-4">
                        <div className="text-blue-700 mb-2">
                            <span>{t`Menunggu konfirmasi pembayaran dari Xendit...`}</span>
                            {pollAttempts > 0 && (
                                <span className="text-sm text-gray-600 ml-2">
                                    ({pollAttempts}/{MAX_POLL_ATTEMPTS})
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            {t`Status akan otomatis diperbarui setelah pembayaran berhasil.`}
                        </div>
                    </div>
                )}
                {!isPolling && !isPaid && pollAttempts >= MAX_POLL_ATTEMPTS && (
                    <div className="mt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                            <p className="text-sm text-yellow-800 mb-2">
                                {t`Pembayaran mungkin sudah berhasil, tetapi konfirmasi belum diterima.`}
                            </p>
                            <button
                                onClick={() => {
                                    setPollAttempts(0);
                                    setIsPolling(true);
                                    checkPaymentStatus();
                                    if (pollingRef.current) {
                                        clearInterval(pollingRef.current);
                                    }
                                    pollingRef.current = setInterval(() => {
                                        checkPaymentStatus();
                                    }, 3000);
                                }}
                                className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
                            >
                                {t`Cek Status Pembayaran Lagi`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </CheckoutContent>
    );
}
