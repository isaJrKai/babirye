/**
 * BABIRYE v10.0.0 — Cryptographic Utility Functions
 *
 * Provides ID generation, HMAC-SHA256 signing/verification,
 * SHA-256 hashing, nonce generation, and value masking.
 *
 * All crypto operations use the Web Crypto API (SubtleCrypto) which is
 * available in modern browsers, Edge Runtime, and recent Node.js.
 */

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID. Uses `crypto.randomUUID()` when available,
 * falling back to a timestamp + random hex string.
 *
 * @param length - Ignored when `crypto.randomUUID` is available (always 36 chars).
 *                 Used as byte count for the fallback path.
 */
export function generateId(length: number = 16): string {
  // Prefer the native UUID v4
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + crypto random hex
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${Date.now().toString(36)}-${hex}`;
}

/**
 * Generate a random hex token (e.g. for CSRF tokens, nonces, etc.).
 * @param bytes - Number of random bytes (default 32 → 64 hex chars).
 */
export function generateToken(bytes: number = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a nonce for Content-Security-Policy or SPA message signing.
 * Base64url-encoded random bytes.
 *
 * @param bytes - Number of random bytes (default 16 → ~22 chars).
 */
export function generateNonce(bytes: number = 16): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  // Base64url encoding (no +, /, = padding)
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ============================================================================
// HMAC-SHA256 Signing & Verification
// ============================================================================

/**
 * Sign a message using HMAC-SHA256.
 * Returns the hex-encoded signature.
 *
 * @param message - The plaintext message to sign.
 * @param secret  - The shared secret key.
 */
export async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify an HMAC-SHA256 signature.
 *
 * @param message   - The plaintext message.
 * @param secret    - The shared secret key.
 * @param signature - The hex-encoded signature to verify against.
 * @returns `true` if the signature is valid.
 */
export async function hmacVerify(message: string, secret: string, signature: string): Promise<boolean> {
  try {
    const expected = await hmacSign(message, secret);
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(expected, signature);
  } catch {
    return false;
  }
}

/**
 * Create a full SPA message signature combining timestamp, nonce, action, service, and params.
 *
 * The message format is: `{timestamp}|{nonce}|{action}|{service}|{params_json}`
 *
 * @returns The hex-encoded HMAC-SHA256 signature.
 */
export async function createSpaSignature(
  timestamp: string,
  nonce: string,
  action: string,
  service: string,
  params: Record<string, unknown> = {},
  secret: string
): Promise<string> {
  const paramsJson = JSON.stringify(params);
  const message = `${timestamp}|${nonce}|${action}|${service}|${paramsJson}`;
  return hmacSign(message, secret);
}

// ============================================================================
// SHA-256 Hashing
// ============================================================================

/**
 * Compute the SHA-256 hash of a string.
 * Returns the hex-encoded digest.
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// Value Masking
// ============================================================================

/**
 * Mask a sensitive value, showing only the last N characters.
 * Useful for displaying API keys, tokens, passwords, etc.
 *
 * @param value        - The value to mask.
 * @param visibleChars - Number of characters to reveal at the end (default 4).
 * @returns The masked string, e.g. "••••••••cret" (if value is "my-secret").
 */
export function maskValue(value: string, visibleChars: number = 4): string {
  if (!value) return '';
  if (value.length <= visibleChars) return '\u2022'.repeat(value.length);
  const maskedLength = value.length - visibleChars;
  return '\u2022'.repeat(maskedLength) + value.slice(-visibleChars);
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if both strings are equal length and contain the same characters.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still compare to avoid length-based timing leak,
    // but result must be false
    const maxLen = Math.max(a.length, b.length);
    let result = a.length ^ b.length;
    for (let i = 0; i < maxLen; i++) {
      result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return result === 0;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}