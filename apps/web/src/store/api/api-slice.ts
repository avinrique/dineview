import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

const baseQuery = fetchBaseQuery({
  baseUrl: (process.env.NEXT_PUBLIC_API_URL || '') + '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const adminToken = state.admin.accessToken;
    const sessionToken = state.session.sessionToken;

    if (adminToken) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    } else if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Menu', 'Categories', 'Dishes', 'Orders', 'Tables', 'Staff', 'Analytics', 'Restaurant'],
  endpoints: () => ({}),
});
