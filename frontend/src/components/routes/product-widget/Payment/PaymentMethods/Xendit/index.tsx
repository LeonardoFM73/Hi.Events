import {useParams} from "react-router";
import {useCreateXenditInvoice} from "../../../../../../queries/useCreateXenditInvoice.ts";
import {useGetEventPublic} from "../../../../../../queries/useGetEventPublic.ts";
import {CheckoutContent} from "../../../../../layouts/Checkout/CheckoutContent";
import {HomepageInfoMessage} from "../../../../../common/HomepageInfoMessage";
import {t} from "@lingui/macro";
import {eventHomepagePath} from "../../../../../../utilites/urlHelper.ts";
import {LoadingMask} from "../../../../../common/LoadingMask";
import {Event} from "../../../../../../types.ts";
import {useEffect} from "react";

interface XenditPaymentMethodProps {
    enabled: boolean;
    setSubmitHandler: (submitHandler: () => () => Promise<void>) => void;
}

export const XenditPaymentMethod = ({enabled, setSubmitHandler}: XenditPaymentMethodProps) => {
    const {eventId, orderShortId} = useParams();
    const {
        data: xenditData,
        isFetched: isXenditFetched,
        error: xenditPaymentError,
        refetch: refetchXenditInvoice
    } = useCreateXenditInvoice(eventId, orderShortId);
    const {data: event} = useGetEventPublic(eventId);

    useEffect(() => {
        if (setSubmitHandler && isXenditFetched) {
            setSubmitHandler(() => async () => {
                if (!xenditData?.invoice_url) {
                    // Refetch to get the latest invoice URL
                    const result = await refetchXenditInvoice();
                    if (result.data?.invoice_url) {
                        window.location.href = result.data.invoice_url;
                    }
                } else {
                    window.location.href = xenditData.invoice_url;
                }
            });
        }
    }, [xenditData, isXenditFetched, setSubmitHandler, refetchXenditInvoice]);

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

    if (!isXenditFetched) {
        return <LoadingMask/>;
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
            </div>
        </CheckoutContent>
    );
}
