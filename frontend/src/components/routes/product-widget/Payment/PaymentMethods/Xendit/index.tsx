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

    // Tambahkan state dan polling payment status
    const [isPolling, setIsPolling] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [pollError, setPollError] = useState("");
    const [pollAttempts, setPollAttempts] = useState(0);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const MAX_POLL_ATTEMPTS = 60; // 60 attempts x 3 seconds = 3 minutes max

    const checkPaymentStatus = useCallback(async () => {
        if (!eventId || !orderShortId) {
            console.log('Skipping payment check: missing eventId or orderShortId');
            return;
        }

        let currentAttempts = 0;
        setPollAttempts(prev => {
            currentAttempts = prev + 1;
            if (currentAttempts >= MAX_POLL_ATTEMPTS) {
                console.log('[Xendit Polling] ⏱️ Max polling attempts reached. Stopping polling.');
                setIsPolling(false);
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            }
            return currentAttempts;
        });

        try {
            console.log(`[Xendit Polling] Checking payment status for order ${orderShortId}... (attempt ${currentAttempts}/${MAX_POLL_ATTEMPTS})`);
            const response = await orderClientPublic.findByShortId(Number(eventId), orderShortId);
            const order = response?.data;
            const paymentStatus = order?.payment_status;

            console.log(`[Xendit Polling] Current payment_status:`, paymentStatus, 'Order status:', order?.status);
            console.log(`[Xendit Polling] Full order data:`, JSON.stringify(order, null, 2));

            if (paymentStatus === 'PAYMENT_RECEIVED') {
                console.log('[Xendit Polling] ✅ Payment received! Stopping polling.');
                setIsPaid(true);
                setIsPolling(false);
                setPollAttempts(0);
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            } else {
                console.log(`[Xendit Polling] ⏳ Still waiting... Current status: ${paymentStatus}`);
            }
        } catch (e) {
            console.error('[Xendit Polling] ❌ Error checking payment status:', e);
            setPollError(t`Failed to check payment status.`);
            setIsPolling(false);
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        }
    }, [eventId, orderShortId]);

    // Auto-redirect ke summary page setelah payment sukses
    useEffect(() => {
        if (isPaid && eventId && orderShortId) {
            console.log('[Xendit] Payment successful! Redirecting to summary page...');
            // Delay sedikit untuk user bisa lihat pesan sukses
            setTimeout(() => {
                window.location.href = `/checkout/${eventId}/${orderShortId}/summary`;
            }, 1000);
        }
    }, [isPaid, eventId, orderShortId]);

    useEffect(() => {
        // Mulai polling segera setelah invoice dibuat
        if (isXenditFetched && xenditData && !isPolling && !isPaid) {
            console.log('[Xendit] Starting payment status polling...');
            setIsPolling(true);
            setPollAttempts(0);

            // Initial check
            checkPaymentStatus();

            // Setup interval untuk polling berikutnya
            const intervalId = setInterval(() => {
                checkPaymentStatus();
            }, 3000);

            pollingRef.current = intervalId;
        }

        // Cleanup hanya saat component unmount atau saat isPaid berubah
        return () => {
            if (pollingRef.current && isPaid) {
                console.log('[Xendit] Cleaning up polling interval (payment completed)');
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [isXenditFetched, xenditData, isPolling, isPaid]);
    // PENTING: Jangan masukkan checkPaymentStatus di sini!

    useEffect(() => {
        if (setSubmitHandler && isXenditFetched) {
            setSubmitHandler(() => async () => {
                console.log('[Xendit] Pay button clicked');
                console.log('[Xendit] xenditData:', xenditData);

                let invoiceUrl = xenditData?.invoice_url;
                if (!invoiceUrl) {
                    console.log('[Xendit] Invoice URL missing, refetching...');
                    const result = await refetchXenditInvoice();
                    console.log('[Xendit] Refetch result:', result.data);
                    invoiceUrl = result.data?.invoice_url;
                }

                if (invoiceUrl) {
                    console.log('[Xendit] Opening payment page in new tab:', invoiceUrl);
                    const newWindow = window.open(invoiceUrl, '_blank', 'noopener'); // buka Xendit di tab baru

                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                        console.warn('[Xendit] Popup blocked! Fallback or show instruction.');
                        // Fallback logic if needed, or simply user alert
                        alert(t`Please allow popups for this site to proceed to payment.`);
                    }

                    // Mulai polling segera setelah buka tab baru (jika belum mulai)
                    if (!isPolling && !isPaid) {
                        console.log('[Xendit] Starting polling after opening payment page...');
                        setIsPolling(true);
                        setPollAttempts(0); // Reset attempts
                        checkPaymentStatus();
                        if (pollingRef.current) {
                            clearInterval(pollingRef.current);
                        }
                        pollingRef.current = setInterval(() => {
                            checkPaymentStatus();
                        }, 3000);
                    }
                } else {
                    console.error('[Xendit] Failed to get invoice URL after refetch');
                    alert(t`Failed to initialize payment. Please try again.`);
                }
            });
        }
    }, [xenditData, isXenditFetched, setSubmitHandler, refetchXenditInvoice, isPolling, isPaid, checkPaymentStatus]);

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
