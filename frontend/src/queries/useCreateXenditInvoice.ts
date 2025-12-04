import {useQuery} from "@tanstack/react-query";
import {orderClientPublic} from "../api/order.client.ts";
import {IdParam} from "../types.ts";

export const GET_CREATE_XENDIT_INVOICE_QUERY_KEY = 'createXenditInvoice';

export const useCreateXenditInvoice = (eventId: IdParam, orderShortId: IdParam) => {
    return useQuery({
        queryKey: [GET_CREATE_XENDIT_INVOICE_QUERY_KEY, eventId, orderShortId],

        queryFn: async () => {
            const {invoice_id, external_id, invoice_url, amount} = await orderClientPublic.createXenditInvoice(
                Number(eventId),
                String(orderShortId),
            );
            return {invoice_id, external_id, invoice_url, amount};
        },

        retry: false,
        staleTime: 0,
        gcTime: 0
    });
}
