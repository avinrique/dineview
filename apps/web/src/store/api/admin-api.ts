import { apiSlice } from './api-slice';

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body: { email: string; password: string }) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
    }),
    getTables: builder.query({
      query: () => '/admin/tables',
      providesTags: ['Tables'],
    }),
    createTable: builder.mutation({
      query: (body) => ({ url: '/admin/tables', method: 'POST', body }),
      invalidatesTags: ['Tables'],
    }),
    updateTable: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/tables/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Tables'],
    }),
    deleteTable: builder.mutation({
      query: (id: string) => ({ url: `/admin/tables/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tables'],
    }),
    generateQr: builder.mutation({
      query: (tableId: string) => ({ url: `/admin/qr/tables/${tableId}/generate`, method: 'POST' }),
      invalidatesTags: ['Tables'],
    }),
    regenerateQr: builder.mutation({
      query: (tableId: string) => ({ url: `/admin/qr/tables/${tableId}/regenerate`, method: 'POST' }),
      invalidatesTags: ['Tables'],
    }),
    closeTableSession: builder.mutation({
      query: (tableId: string) => ({ url: `/admin/tables/${tableId}/close-session`, method: 'POST' }),
      invalidatesTags: ['Tables', 'Orders', 'Analytics'],
    }),
    uploadFile: builder.mutation<{ data: { url: string; kind: 'image' | 'model'; fileSizeBytes: number } }, File>({
      query: (file) => ({
        url: `/admin/uploads?filename=${encodeURIComponent(file.name)}`,
        method: 'POST',
        body: file,
        headers: { 'Content-Type': 'application/octet-stream' },
      }),
    }),
    getStaff: builder.query({
      query: () => '/admin/staff',
      providesTags: ['Staff'],
    }),
    createStaff: builder.mutation({
      query: (body) => ({ url: '/admin/staff', method: 'POST', body }),
      invalidatesTags: ['Staff'],
    }),
    deleteStaff: builder.mutation({
      query: (id: string) => ({ url: `/admin/staff/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Staff'],
    }),
    getDashboard: builder.query({
      query: () => '/admin/analytics/dashboard',
      providesTags: ['Analytics'],
    }),
    getRevenue: builder.query({
      query: (days: number = 30) => `/admin/analytics/revenue?days=${days}`,
      providesTags: ['Analytics'],
    }),
    getTopDishes: builder.query({
      query: (limit: number = 10) => `/admin/analytics/top-dishes?limit=${limit}`,
      providesTags: ['Analytics'],
    }),
    getRestaurant: builder.query({
      query: () => '/admin/restaurant',
      providesTags: ['Restaurant'],
    }),
    updateRestaurant: builder.mutation({
      query: (body) => ({ url: '/admin/restaurant', method: 'PATCH', body }),
      invalidatesTags: ['Restaurant'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useGetTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useGenerateQrMutation,
  useRegenerateQrMutation,
  useCloseTableSessionMutation,
  useUploadFileMutation,
  useGetStaffQuery,
  useCreateStaffMutation,
  useDeleteStaffMutation,
  useGetDashboardQuery,
  useGetRevenueQuery,
  useGetTopDishesQuery,
  useGetRestaurantQuery,
  useUpdateRestaurantMutation,
} = adminApi;
