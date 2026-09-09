/**
 * Marian Best Class Evaluation System - Centralized API Client
 * 
 * Provides unified HTTP communication, automatic Bearer token injection,
 * silent 401 token refresh retry, standardized error parsing, and timeout support.
 */

export interface ApiErrorResponse {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse | null;

  constructor(message: string, status: number, data: ApiErrorResponse | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const clean = envUrl.replace(/\/+$/, '');
  // If envUrl already includes /api, don't duplicate
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

// Queue for pending requests during token refresh to avoid duplicate refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bc_access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bc_refresh_token');
};

const setTokens = (access: string, refresh?: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bc_access_token', access);
  if (refresh) {
    localStorage.setItem('bc_refresh_token', refresh);
  }
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bc_access_token');
  localStorage.removeItem('bc_refresh_token');
};

/**
 * Perform silent token refresh via /auth/token/refresh/
 */
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      const newAccess = data.access;
      if (newAccess) {
        setTokens(newAccess, data.refresh);
        return newAccess;
      }
    }
  } catch (err) {
    console.error('Silent token refresh failed:', err);
  }

  // Refresh failed; clear invalid session
  clearTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  }
  return null;
};

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuth?: boolean;
  retryOn401?: boolean;
}

/**
 * Core centralized request runner
 */
async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    params,
    body,
    headers: customHeaders = {},
    timeoutMs = 30000,
    skipAuth = false,
    retryOn401 = true,
    ...fetchOptions
  } = options;

  const baseUrl = getBaseUrl();
  // Normalize endpoint: ensure it starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Build query string
  let url = `${baseUrl}${cleanEndpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers = new Headers(customHeaders);

  // Auto attach Bearer token
  if (!skipAuth) {
    const token = getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Determine body format
  let finalBody: BodyInit | null | undefined = undefined;
  if (body !== undefined && body !== null) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      // Browser automatically sets multipart boundary
      finalBody = body;
    } else {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      finalBody = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      body: finalBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 401 Interceptor: Auto token refresh & retry
    if (res.status === 401 && retryOn401 && !skipAuth) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          if (newToken) {
            onRefreshed(newToken);
            // Retry original request with new token
            return request<T>(endpoint, {
              ...options,
              retryOn401: false,
            });
          }
        } else {
          // Wait for concurrent refresh
          return new Promise<T>((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              request<T>(endpoint, {
                ...options,
                retryOn401: false,
              })
                .then(resolve)
                .catch(reject);
            });
          });
        }
      }
    }

    // Parse response
    let responseData: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseData = await res.json().catch(() => null);
    } else {
      responseData = await res.text().catch(() => null);
    }

    if (!res.ok) {
      const errorMsg =
        responseData?.error ||
        responseData?.detail ||
        responseData?.message ||
        (typeof responseData === 'string' ? responseData : `Request failed with status ${res.status}`);
      throw new ApiError(errorMsg, res.status, responseData);
    }

    return responseData as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err?.message || 'Network request failed', 0, null);
  }
}

/**
 * Public API client interface
 */
export const apiClient = {
  get: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T = any>(endpoint: string, formData: FormData, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData }),

  // Token management helpers
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getBaseUrl,
};

export default apiClient;
