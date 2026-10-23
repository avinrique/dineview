import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '../index';
import { getValidAccessToken, refreshAccessToken } from '../auth-refresh';
import { endSession } from '../slices/session-slice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: (process.env.NEXT_PUBLIC_API_URL || '') + '/api/v1',
});

// Staff endpoints use the admin JWT; everything else is a customer call that
// uses the table session token. Picking by URL (rather than "admin token if
// present") lets someone signed in as staff also try the customer flow.
function isStaffEndpoint(url: string) {
  return url.startsWith('/admin') || url.startsWith('/orders/admin') || url.startsWith('/auth');
}

function withToken(args: FetchArgs, token: string | null): FetchArgs {
  if (!token) return args;
  return { ...args, headers: { ...(args.headers as Record<string, string>), Authorization: `Bearer ${token}` } };
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const req: FetchArgs = typeof args === 'string' ? { url: args } : args;
  const state = api.getState() as RootState;

  if (!isStaffEndpoint(req.url)) {
    const sessionToken = state.session.sessionToken;
    const result = await rawBaseQuery(withToken(req, sessionToken), api, extraOptions);
    if (result.error?.status === 401 && sessionToken) {
      api.dispatch(endSession('expired'));
    }
    return result;
  }

  if (req.url === '/auth/login' || req.url === '/auth/refresh') {
    return rawBaseQuery(req, api, extraOptions);
  }

  const token = await getValidAccessToken(api.getState, api.dispatch);
  let result = await rawBaseQuery(withToken(req, token), api, extraOptions);
  if (result.error?.status === 401) {
    const fresh = await refreshAccessToken(api.getState, api.dispatch);
    if (fresh) result = await rawBaseQuery(withToken(req, fresh), api, extraOptions);
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Menu', 'Categories', 'Dishes', 'Orders', 'Tables', 'Staff', 'Analytics', 'Restaurant'],
  endpoints: () => ({}),
});
