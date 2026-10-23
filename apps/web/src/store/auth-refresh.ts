import { updateTokens, clearCredentials } from './slices/admin-slice';
import type { AdminState } from './slices/admin-slice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type GetState = () => unknown;
type Dispatch = (action: any) => unknown;

let inFlight: Promise<string | null> | null = null;

// Refresh tokens rotate on use, so concurrent 401s must share one refresh call
// or all but the first would fail and log the user out.
export function refreshAccessToken(getState: GetState, dispatch: Dispatch): Promise<string | null> {
  if (!inFlight) {
    inFlight = (async () => {
      const { refreshToken } = (getState() as { admin: AdminState }).admin;
      if (!refreshToken) return null;
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          dispatch(clearCredentials());
          return null;
        }
        const { data } = await res.json();
        dispatch(updateTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
        return data.accessToken as string;
      } catch {
        // Network error: keep the session, the next request will retry
        return null;
      }
    })().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

function tokenExpiresSoon(token: string, withinMs = 30_000) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 - Date.now() < withinMs;
  } catch {
    return true;
  }
}

/** Current staff access token, refreshed first if it is about to expire. */
export async function getValidAccessToken(getState: GetState, dispatch: Dispatch): Promise<string | null> {
  const { accessToken } = (getState() as { admin: AdminState }).admin;
  if (accessToken && !tokenExpiresSoon(accessToken)) return accessToken;
  return refreshAccessToken(getState, dispatch);
}
