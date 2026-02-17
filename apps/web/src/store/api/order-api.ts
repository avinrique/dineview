import { apiSlice } from './api-slice';

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders'],
    }),
    getSessionOrders: builder.query({
      query: () => '/orders/my',
      providesTags: ['Orders'],
    }),
    getAdminOrders: builder.query({
      query: (params?: { page?: number; limit?: number; status?: string }) => ({
        url: '/orders/admin',
        params,
      }),
      providesTags: ['Orders'],
    }),
    getAdminOrderById: builder.query({
      query: (id: string) => `/orders/admin/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/orders/admin/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetSessionOrdersQuery,
  useGetAdminOrdersQuery,
  useGetAdminOrderByIdQuery,
  useUpdateOrderStatusMutation,
} = orderApi;
