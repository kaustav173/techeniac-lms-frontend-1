import { env } from '@/lib/config';
import { ApiError } from '@/lib/errors';

export { ApiError } from '@/lib/errors';

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  responseType?: 'json' | 'blob';
  _isRetry?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;
let refreshPromise: Promise<boolean> | null = null;

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  if (!Number.isNaN(seconds)) {
    return seconds;
  }
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, Math.ceil((dateMs - Date.now()) / 1000));
  }
  return undefined;
}

function isAuthBypassEndpoint(endpoint: string): boolean {
  const clean = endpoint.replace(/^\/?(api\/v1\/)?/, '');
  return (
    clean.startsWith('auth/login') ||
    clean.startsWith('auth/refresh') ||
    clean.startsWith('auth/logout') ||
    clean.startsWith('auth/forgot-password') ||
    clean.startsWith('auth/reset-password') ||
    clean.startsWith('auth/verify-reset-token')
  );
}

async function requestTokenRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildRequestUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const stripped = endpoint.replace(/^\/?(api\/v1\/)?/, '');
  const normalizedPath = `/${stripped}`;
  const baseUrl =
    typeof window === 'undefined' && !env.NEXT_PUBLIC_API_BASE_URL.startsWith('http')
      ? process.env.BACKEND_API_URL || 'http://localhost:4000/api/v1'
      : env.NEXT_PUBLIC_API_BASE_URL;
  let url = `${baseUrl}${normalizedPath}`;

  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  return url;
}

function parseErrorPayload(response: Response, data: unknown): ApiError {
  const errData = isApiErrorResponse(data) ? data : null;
  const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));

  if (response.status >= 500) {
    return new ApiError(
      response.status,
      'A server error occurred. Please try again later.',
      'SERVER_ERROR',
      undefined,
      retryAfter,
    );
  }

  // Fallback chain uses || intentionally so empty strings fall through to the default message
  let message =
    errData?.error?.message || errData?.message || response.statusText || 'An error occurred';

  // Surface detailed field-level validation errors so user sees exactly what is invalid
  if (Array.isArray(errData?.error?.details) && errData.error.details.length > 0) {
    const detailList = (errData.error.details as Array<{ field?: string; message?: string }>)
      .map((d) => {
        if (d.field && d.message) {
          return `${d.field}: ${d.message}`;
        }
        return d.message || '';
      })
      .filter(Boolean);

    if (detailList.length > 0) {
      message = `${message} — ${detailList.join('; ')}`;
    }
  }

  if (response.status === 429 && retryAfter && !errData?.error?.message) {
    const minutes = Math.ceil(retryAfter / 60);
    message = `Too many requests. Please try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
  }

  const code = errData?.error?.code || (response.status === 429 ? 'RATE_LIMITED' : 'HTTP_ERROR');
  const details = errData?.error?.details;

  return new ApiError(response.status, message, code, details, retryAfter);
}

function handleFetchError(
  fetchError: unknown,
  controller: AbortController,
  userSignal?: AbortSignal | null,
): never {
  if (controller.signal.aborted && !userSignal?.aborted) {
    throw new ApiError(408, 'Request timed out, please try again.', 'REQUEST_TIMEOUT');
  }
  if (fetchError instanceof ApiError) {
    throw fetchError;
  }
  throw new ApiError(
    0,
    'Unable to connect to server. Please check your internet connection.',
    'NETWORK_ERROR',
  );
}

async function safeParseJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return {};
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    params,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: userSignal,
    responseType = 'json',
    ...customConfig
  } = options;

  const url = buildRequestUrl(endpoint, params);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  if (userSignal) {
    userSignal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  const defaultHeaders: HeadersInit =
    responseType === 'blob'
      ? { Accept: '*/*' }
      : {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

  const config: RequestInit = {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    signal: controller.signal,
    ...customConfig,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (fetchError) {
    handleFetchError(fetchError, controller, userSignal);
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && !options._isRetry && !isAuthBypassEndpoint(endpoint)) {
    refreshPromise ??= requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (refreshed) {
      return apiClient<T>(endpoint, {
        ...options,
        _isRetry: true,
      });
    }
  }

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw parseErrorPayload(response, data);
  }

  if (responseType === 'blob') {
    return (await response.blob()) as unknown as T;
  }

  const data = await safeParseJson(response);
  return data as T;
}

export async function apiBlobClient(endpoint: string, options: RequestOptions = {}): Promise<Blob> {
  const {
    params,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: userSignal,
    ...customConfig
  } = options;

  const url = buildRequestUrl(endpoint, params);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  if (userSignal) {
    userSignal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  const defaultHeaders: HeadersInit = {
    Accept: '*/*',
  };

  const config: RequestInit = {
    method: 'GET',
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    signal: controller.signal,
    ...customConfig,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (fetchError) {
    handleFetchError(fetchError, controller, userSignal);
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && !options._isRetry && !isAuthBypassEndpoint(endpoint)) {
    refreshPromise ??= requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (refreshed) {
      return apiBlobClient(endpoint, {
        ...options,
        _isRetry: true,
      });
    }
  }

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw parseErrorPayload(response, data);
  }

  return response.blob();
}
