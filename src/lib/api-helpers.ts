/**
 * BABIRYE v10.0.0 — API Helper Functions
 *
 * Typed fetch wrappers with auth injection, error handling,
 * request/response interceptor logging, and standardised error responses.
 *
 * NOTE: Client-side only. Do not import in server components or API routes.
 */

'use client';

// ============================================================================
// Types
// ============================================================================

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  /** JSON body — will be serialised automatically. */
  body?: unknown;
  /** Query parameters appended to the URL. */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Skip adding the Authorization header. */
  skipAuth?: boolean;
  /** Custom timeout in milliseconds (default 30 000). */
  timeoutMs?: number;
  /** AbortSignal for request cancellation. */
  signal?: AbortSignal;
}

interface ApiErrorBody {
  error?: string;
  detail?: string;
  message?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT_MS = 30_000;
const AUTH_TOKEN_KEY = 'babirye_session_token';

// ============================================================================
// Interceptor logging (development only)
// ============================================================================

function logRequest(method: string, url: string, options?: ApiRequestOptions): void {
  if (process.env.NODE_ENV !== 'development') return;
  console.debug(`[API] → ${method} ${url}`, {
    hasAuth: !options?.skipAuth,
    hasBody: !!options?.body,
    params: options?.params ?? {},
  });
}

function logResponse(method: string, url: string, status: number, durationMs: number): void {
  if (process.env.NODE_ENV !== 'development') return;
  const tag = status < 400 ? '✓' : '✗';
  console.debug(`[API] ${tag} ${method} ${url} — ${status} (${durationMs}ms)`);
}

// ============================================================================
// Token management
// ============================================================================

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// ============================================================================
// Error handling
// ============================================================================

/**
 * Extract a user-friendly error message from an API response.
 * Falls back to a generic message for unexpected status codes.
 */
function extractErrorMessage(status: number, body: ApiErrorBody): string {
  // Client errors
  if (status === 401) return 'Session expired. Please log in again.';
  if (status === 403) return body.detail || body.error || 'You do not have permission to perform this action.';
  if (status === 404) return body.error || 'The requested resource was not found.';
  if (status === 409) return body.detail || body.error || 'A conflict occurred with the current state.';
  if (status === 422) return body.detail || 'The provided data is invalid.';
  if (status === 429) return 'Too many requests. Please try again later.';

  // Server errors
  if (status >= 500) return 'An unexpected server error occurred. Please try again.';

  // Other
  return body.error || body.message || 'An unknown error occurred.';
}

/**
 * Handle HTTP error responses. Returns a rejected promise with a formatted message.
 */
function handleErrorResponse(response: Response, body: ApiErrorBody): never {
  const message = extractErrorMessage(response.status, body);

  // Trigger redirect for 401 (unauthenticated)
  if (response.status === 401 && typeof window !== 'undefined') {
    // Clear stale token
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // Only redirect if not already on the login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/?view=login';
    }
  }

  throw new ApiClientError(message, response.status, body);
}

// ============================================================================
// Custom error class
// ============================================================================

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly detail: ApiErrorBody;

  constructor(message: string, statusCode: number, detail?: ApiErrorBody) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.detail = detail ?? {};
  }
}

// ============================================================================
// Core request function
// ============================================================================

/**
 * Base API request wrapper.
 * - Injects Authorization header from localStorage.
 * - Serialises JSON body.
 * - Appends query parameters.
 * - Handles timeout via AbortController.
 * - Parses JSON responses.
 */
export async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    body,
    params,
    skipAuth = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: externalSignal,
    headers: customHeaders,
    ...rest
  } = options;

  // Build URL with query params
  let finalUrl = getApiUrl(url);
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) finalUrl += `?${qs}`;
  }

  // Build headers
  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine signals
  const combinedSignal = externalSignal
    ? AbortSignal.any([externalSignal, controller.signal])
    : controller.signal;

  const startTime = performance.now();
  logRequest(rest.method || 'GET', finalUrl, options);

  try {
    const response = await fetch(finalUrl, {
      ...rest,
      headers,
      signal: combinedSignal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const durationMs = Math.round(performance.now() - startTime);
    logResponse(rest.method || 'GET', finalUrl, response.status, durationMs);

    // Parse body
    let responseBody: ApiErrorBody = {};
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else if (response.status !== 204) {
      // Non-JSON response that isn't empty — try text
      const text = await response.text();
      responseBody = { error: text };
    }

    // Handle errors
    if (!response.ok) {
      handleErrorResponse(response, responseBody);
    }

    return responseBody as unknown as T;
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    logResponse(rest.method || 'GET', finalUrl, 0, durationMs);

    if (error instanceof ApiClientError) throw error;

    // Timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError('Request timed out. Please try again.', 0);
    }

    // Network error
    if (error instanceof TypeError) {
      throw new ApiClientError('Network error. Please check your connection.', 0);
    }

    // Unknown
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unexpected error occurred.',
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// Convenience methods
// ============================================================================

/** Perform a GET request with optional query parameters. */
export async function apiGet<T>(url: string, params?: ApiRequestOptions['params']): Promise<T> {
  return apiRequest<T>(url, { method: 'GET', params });
}

/** Perform a POST request with an optional JSON body. */
export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, { method: 'POST', body });
}

/** Perform a PUT request with an optional JSON body. */
export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, { method: 'PUT', body });
}

/** Perform a PATCH request with an optional JSON body. */
export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, { method: 'PATCH', body });
}

/** Perform a DELETE request. */
export async function apiDelete(url: string): Promise<void> {
  await apiRequest(url, { method: 'DELETE' });
}

// ============================================================================
// URL helper
// ============================================================================

/**
 * Returns a relative API URL (for use with Caddy gateway).
 * Always returns a path starting with `/api/`.
 */
export function getApiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean.startsWith('/api') ? clean : `/api${clean}`;
}