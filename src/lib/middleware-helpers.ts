/**
 * BABIRYE v10.0.0 — Next.js Middleware
 *
 * Provides security headers, request ID injection, CORS handling,
 * IP-based rate limiting, and common attack path blocking.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Constants
// ============================================================================

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

/** Paths commonly probed by bots / scanners — always block. */
const BLOCKED_PATHS = [
  '/wp-admin',
  '/wp-login',
  '/wp-content',
  '/phpmyadmin',
  '/.env',
  '/config.json',
  '/.git',
  '/.svn',
  '/debug',
  '/trace',
  '/actuator',
  '/.well-known/security.txt',
  '/server-status',
  '/server-info',
  '/phpinfo',
  '/admin.php',
  '/xmlrpc.php',
];

// ============================================================================
// In-memory rate limiter (Edge Runtime compatible)
// ============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/** Periodically prune stale entries to prevent memory leaks. */
let lastPrune = Date.now();
function pruneRateLimits(now: number): void {
  if (now - lastPrune > RATE_LIMIT_WINDOW_MS * 2) {
    for (const [key, entry] of rateLimitStore) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
    lastPrune = now;
  }
}

/**
 * Check whether the given IP is within rate limits.
 * Returns `true` if the request should be allowed.
 */
function checkRateLimit(ip: string, now: number): boolean {
  pruneRateLimits(now);

  const existing = rateLimitStore.get(ip);
  if (!existing || now - existing.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  existing.count += 1;
  return true;
}

// ============================================================================
// Helpers
// ============================================================================

/** Generate a short random hex ID for request tracing. */
function generateRequestId(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Determine client IP from request headers (respects X-Forwarded-For). */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '0.0.0.0';
}

/** Check if the request path matches any blocked patterns. */
function isBlockedPath(pathname: string): boolean {
  const normalised = pathname.toLowerCase();
  return BLOCKED_PATHS.some(
    (blocked) => normalised === blocked || normalised.startsWith(blocked + '/') || normalised.startsWith(blocked + '?')
  );
}

/** Log blocked request details (server-side console). */
function logBlockedRequest(ip: string, path: string, reason: string): void {
  const timestamp = new Date().toISOString();
  console.warn(`[BABIRYE:MIDDLEWARE] BLOCKED ${timestamp} | IP=${ip} | Path=${path} | Reason=${reason}`);
}

// ============================================================================
// CORS handling
// ============================================================================

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '*').split(',').map((o) => o.trim());

function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') return null;

  const origin = request.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS.find((o) => o === origin) || '';

  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin || origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-SPA-Signature');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// ============================================================================
// Security headers applied to every response
// ============================================================================

function applySecurityHeaders(response: NextResponse, requestId: string): void {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // Legacy XSS protection (still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Control referrer information leakage
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict browser feature access
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // HSTS — enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // Inject request ID for tracing
  response.headers.set('X-Request-ID', requestId);
}

// ============================================================================
// Main middleware
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const now = Date.now();
  const requestId = generateRequestId();
  const clientIp = getClientIp(request);

  // --- 1. Block common attack / probe paths --------------------------------
  if (isBlockedPath(pathname)) {
    logBlockedRequest(clientIp, pathname, 'Blocked attack path');
    return new NextResponse('Forbidden', {
      status: 403,
      headers: { 'X-Request-ID': requestId, 'Content-Type': 'text/plain' },
    });
  }

  // --- 2. CORS preflight ---------------------------------------------------
  const corsResponse = handleCorsPreflight(request);
  if (corsResponse) {
    applySecurityHeaders(corsResponse, requestId);
    return corsResponse;
  }

  // --- 3. Rate limiting ----------------------------------------------------
  if (!checkRateLimit(clientIp, now)) {
    logBlockedRequest(clientIp, pathname, 'Rate limit exceeded');
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
          'X-Request-ID': requestId,
        },
      }
    );
  }

  // --- 4. Continue with security headers -----------------------------------
  const response = NextResponse.next();
  applySecurityHeaders(response, requestId);

  // Add CORS headers for non-preflight requests
  const origin = request.headers.get('origin') || '';
  if (origin) {
    const allowedOrigin = ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS.find((o) => o === origin) || '';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin || origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Expose-Headers', 'X-Request-ID');
  }

  return response;
}

// ============================================================================
// Matcher config — run on API routes and pages, skip static assets
// ============================================================================

export const config = {
  matcher: ['/api/:path*', '/((?!assets/|_next/|favicon\\.ico).*)'],
};