// Empty by default so the browser hits relative `/api/v1` paths, which Next.js
// proxies to the API server-side. This keeps everything same-origin HTTPS and
// works from a phone (where `localhost` would point at the phone itself).
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/v1${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export async function scanQrCode(token: string) {
  return apiClient<{
    success: boolean;
    data: {
      sessionToken: string;
      restaurant: any;
      table: any;
      session: any;
    };
  }>(`/scan/${token}`);
}
