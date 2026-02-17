import { apiSlice } from './api-slice';

export const menuApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMenu: builder.query({
      query: () => '/menu',
      providesTags: ['Menu'],
    }),
    getDishDetail: builder.query({
      query: (dishId: string) => `/menu/dishes/${dishId}`,
      providesTags: (_result, _error, id) => [{ type: 'Dishes', id }],
    }),
    getCategoryBySlug: builder.query({
      query: (slug: string) => `/menu/categories/${slug}`,
    }),
    // Admin endpoints
    getAdminDishes: builder.query({
      query: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) => ({
        url: '/admin/dishes',
        params,
      }),
      providesTags: ['Dishes'],
    }),
    createDish: builder.mutation({
      query: (body) => ({ url: '/admin/dishes', method: 'POST', body }),
      invalidatesTags: ['Dishes', 'Menu'],
    }),
    updateDish: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/dishes/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Dishes', 'Menu'],
    }),
    deleteDish: builder.mutation({
      query: (id: string) => ({ url: `/admin/dishes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Dishes', 'Menu'],
    }),
    toggleAvailability: builder.mutation({
      query: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => ({
        url: `/admin/dishes/${id}/availability`,
        method: 'PATCH',
        body: { isAvailable },
      }),
      invalidatesTags: ['Dishes', 'Menu'],
    }),
    getAdminCategories: builder.query({
      query: () => '/admin/categories',
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation({
      query: (body) => ({ url: '/admin/categories', method: 'POST', body }),
      invalidatesTags: ['Categories', 'Menu'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Categories', 'Menu'],
    }),
    deleteCategory: builder.mutation({
      query: (id: string) => ({ url: `/admin/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories', 'Menu'],
    }),
    reorderCategories: builder.mutation({
      query: (body) => ({ url: '/admin/categories/reorder', method: 'PATCH', body }),
      invalidatesTags: ['Categories', 'Menu'],
    }),
  }),
});

export const {
  useGetMenuQuery,
  useGetDishDetailQuery,
  useGetCategoryBySlugQuery,
  useGetAdminDishesQuery,
  useCreateDishMutation,
  useUpdateDishMutation,
  useDeleteDishMutation,
  useToggleAvailabilityMutation,
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
} = menuApi;
