import { useQuery } from "@tanstack/react-query";
import { orderClientPublic } from "../api/order.client.ts";
import { IdParam } from "../types.ts";

export const GET_CREATE_MOCK_PAYMENT_QUERY_KEY = 'createMockPayment';

export const useCreateMockPayment = (eventId: IdParam, orderShortId: IdParam) => {
    return useQuery({
        queryKey: [GET_CREATE_MOCK_PAYMENT_QUERY_KEY, eventId, orderShortId],

        queryFn: async () => {
            const { payment_id, order_short_id, status, message, webhook_url } = await orderClientPublic.createMockPayment(
                Number(eventId),
                String(orderShortId),
            );
            return { payment_id, order_short_id, status, message, webhook_url };
        },

        retry: false,
        staleTime: 0,
        gcTime: 0
    });
}
