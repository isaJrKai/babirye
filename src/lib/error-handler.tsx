/**
 * BABIRYE v10.0.0 — Error Handler Module
 *
 * Comprehensive error handling: custom error classes, React error boundary,
 * API error extraction, error reporting, and network error detection.
 */

'use client';

import React from 'react';

// ============================================================================
// AppError — Base application error
// ============================================================================

export class AppError extends Error {
  /** Machine-readable error code (e.g. 'NOT_FOUND', 'VALIDATION_FAILED'). */
  public readonly code: string;
  /** HTTP status code for API responses. */
  public readonly statusCode: number;
  /** Optional additional details for debugging. */
  public readonly details?: Record<string, unknown>;
  /** Whether this is an expected / operational error (vs a bug). */
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
  }
}

// ============================================================================
// Predefined error subclasses
// ============================================================================

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: Record<string, unknown>) {
    super(`${resource} not found`, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    fields?: Record<string, string[]>,
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_FAILED', 422, { ...details, fields }, true);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(retryAfterSeconds?: number) {
    super(
      'Too many requests. Please try again later.',
      'RATE_LIMITED',
      429,
      { retryAfter: retryAfterSeconds }
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfterSeconds;
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503);
    this.name = 'ServiceUnavailableError';
  }
}

// ============================================================================
// Error extraction utilities
// ============================================================================

interface ErrorResponseBody {
  error?: string;
  detail?: string;
  message?: string;
  fields?: Record<string, string[]>;
}

/**
 * Extract a user-friendly message from an API error.
 * Works with AppError instances, fetch Response objects, or generic errors.
 */
export function handleApiError(error: unknown): string {
  // AppError instances
  if (error instanceof AppError) {
    return error.message;
  }

  // Fetch Response (pass the body as second arg)
  if (error instanceof Response) {
    return `Request failed with status ${error.status}`;
  }

  // Error with response data (from api-helpers)
  if (error && typeof error === 'object' && 'statusCode' in error && 'detail' in error) {
    const err = error as { statusCode: number; detail?: ErrorResponseBody };
    if (err.detail?.error) return err.detail.error;
    if (err.detail?.message) return err.detail.message;
    if (err.statusCode === 401) return 'Session expired. Please log in again.';
    if (err.statusCode === 403) return 'You do not have permission to perform this action.';
    if (err.statusCode === 404) return 'The requested resource was not found.';
    if (err.statusCode === 429) return 'Too many requests. Please try again later.';
    if (err.statusCode >= 500) return 'An unexpected server error occurred.';
  }

  // Standard Error
  if (error instanceof Error) {
    return getErrorMessage(error);
  }

  // Fallback
  return 'An unexpected error occurred.';
}

/**
 * Convert any error value into a human-readable message string.
 */
export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return 'An unknown error occurred.';
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Common network errors
    if (isNetworkError(error)) return 'Network error. Please check your connection.';
    if (isTimeoutError(error)) return 'Request timed out. Please try again.';

    return error.message || 'An unexpected error occurred.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return 'An unexpected error occurred.';
}

// ============================================================================
// Network error detection
// ============================================================================

/** Network-related error messages produced by the browser's fetch API. */
const NETWORK_ERROR_PATTERNS = [
  'Failed to fetch',
  'NetworkError',
  'Network request failed',
  'net::ERR_',
  'NS_ERROR_NET',
  'The Internet connection appears to be offline',
  'A network error occurred',
  'fetch failed',
];

/** Timeout-related error messages. */
const TIMEOUT_ERROR_PATTERNS = [
  'Timeout',
  'timeout',
  'Timed out',
  'timed out',
  'AbortError',
  'The operation was aborted',
  'Request timed out',
  'TIMEOUT',
];

/**
 * Check if an error is caused by a network connectivity issue.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return NETWORK_ERROR_PATTERNS.some((pattern) => error.message.includes(pattern));
  }
  if (error instanceof Error) {
    return NETWORK_ERROR_PATTERNS.some((pattern) => error.message.includes(pattern));
  }
  return false;
}

/**
 * Check if an error is caused by a request timeout.
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof Error) {
    return TIMEOUT_ERROR_PATTERNS.some((pattern) => error.message.includes(pattern));
  }
  return false;
}

// ============================================================================
// Error reporting
// ============================================================================

/**
 * Report an error — logs to console and optionally sends to the audit endpoint.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const message = getErrorMessage(error);

  // Console logging
  console.error(`[BABIRYE:ERROR] ${message}`, {
    error,
    context,
    timestamp: new Date().toISOString(),
  });

  // Optional: send to server audit endpoint (best-effort)
  if (typeof window !== 'undefined' && navigator.sendBeacon) {
    try {
      const payload = JSON.stringify({
        action: 'error.reported',
        resource: 'client',
        details: {
          message,
          name: error instanceof Error ? error.name : 'UnknownError',
          stack: error instanceof Error ? error.stack : undefined,
          context,
          url: window.location.href,
        },
      });
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/audit', blob);
    } catch {
      // Silently ignore reporting failures
    }
  }
}

// ============================================================================
// React Error Boundary
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Called when an error is caught. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React class component error boundary for catching render-time errors.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    reportError(error, { componentStack: errorInfo.componentStack });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <div className="text-3xl">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            {getErrorMessage(this.state.error)}
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// withErrorBoundary — Higher-Order Component
// ============================================================================

/**
 * HOC that wraps a component with an ErrorBoundary.
 *
 * @example
 * const SafeMyComponent = withErrorBoundary(MyComponent, {
 *   fallback: (err, reset) => <p>Error: {err.message}</p>,
 * });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fallback?: ErrorBoundaryProps['fallback'];
    onError?: ErrorBoundaryProps['onError'];
  }
): React.ComponentType<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithBoundary = (props: P) => (
    <ErrorBoundary fallback={options?.fallback} onError={options?.onError}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithBoundary;
}