/**
 * BABIRYE v10.0.0 — SPA (Single Packet Authorization) Utilities
 *
 * Client-side SPA packet creation, verification, and shell command
 * generation for single-packet authorization workflows.
 *
 * Uses the Web Crypto API for HMAC-SHA256 signing so this module
 * works in browser environments without any Node.js crypto dependency.
 */

'use client';

// ============================================================================
// Constants
// ============================================================================

/** Time window (seconds) within which a SPA packet is considered valid. */
export const SPA_WINDOW_SECONDS = 300;

/** Length of the random nonce in hex characters (16 bytes → 32 hex chars). */
export const NONCE_LENGTH = 32;

/** Default HMAC algorithm identifier. */
const HMAC_ALGORITHM = 'SHA-256';

// ============================================================================
// Types
// ============================================================================

/** Represents a fully-formed SPA packet ready for transmission. */
export interface SPAPacket {
  /** ISO-8601 UTC timestamp when the packet was created. */
  timestamp: string;
  /** Random hex nonce to prevent replay attacks. */
  nonce: string;
  /** The requested action (e.g. 'open', 'close', 'status'). */
  action: string;
  /** Optional target service identifier. */
  service?: string;
  /** Optional action parameters. */
  params?: Record<string, unknown>;
  /** HMAC-SHA256 signature of the canonical payload. */
  signature: string;
}

/** Parsed/verified result from a SPA response. */
export interface SPAResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
  packetId?: string;
  processedAt?: string;
}

// ============================================================================
// Crypto Helpers
// ============================================================================

/**
 * Generate a cryptographically secure random nonce as a hex string.
 * Uses the Web Crypto API available in all modern browsers.
 */
export function generateNonce(length: number = NONCE_LENGTH): string {
  const byteLength = Math.ceil(length / 2);
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

/**
 * Compute an HMAC-SHA256 signature over the given message using the
 * Web Crypto API (SubtleCrypto).
 *
 * This is the browser-safe alternative to Node.js `crypto.createHmac`.
 */
export async function computeHmacSha256(
  message: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: HMAC_ALGORITHM },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const signatureArray = new Uint8Array(signatureBuffer);
  return Array.from(signatureArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Build the canonical string that gets signed.
 * All fields are sorted alphabetically for deterministic output.
 */
function buildCanonicalPayload(
  timestamp: string,
  nonce: string,
  action: string,
  service?: string,
  params?: Record<string, unknown>
): string {
  const parts: string[] = [
    `action=${action}`,
    `nonce=${nonce}`,
    `timestamp=${timestamp}`,
  ];

  if (service) {
    parts.push(`service=${service}`);
  }

  if (params && Object.keys(params).length > 0) {
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      const value = params[key];
      parts.push(`${key}=${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
    }
  }

  return parts.join('&');
}

// ============================================================================
// SPA Packet Operations
// ============================================================================

/**
 * Create a fully-formed SPA packet with timestamp, nonce, and HMAC-SHA256
 * signature.
 *
 * @param action   - The action to authorise (e.g. 'open', 'close', 'status')
 * @param service  - Optional target service name
 * @param params   - Optional action parameters
 * @param secret   - Shared secret used for HMAC signing
 * @returns A complete SPAPacket ready for transmission
 */
export async function createSpaPacket(
  action: string,
  service?: string,
  params?: Record<string, unknown>,
  secret?: string
): Promise<SPAPacket> {
  const timestamp = new Date().toISOString();
  const nonce = generateNonce(NONCE_LENGTH);

  const canonical = buildCanonicalPayload(timestamp, nonce, action, service, params);

  let signature = '';
  if (secret) {
    signature = await computeHmacSha256(canonical, secret);
  }

  return {
    timestamp,
    nonce,
    action,
    service,
    params,
    signature,
  };
}

/**
 * Verify the HMAC-SHA256 signature of a received SPA packet.
 *
 * Checks:
 * 1. The packet has all required fields.
 * 2. The timestamp is within the replay window (SPA_WINDOW_SECONDS).
 * 3. The HMAC signature matches.
 *
 * @returns `true` if the packet is valid, `false` otherwise.
 */
export async function verifySpaSignature(
  packet: SPAPacket,
  secret: string
): Promise<boolean> {
  // --- Structural validation ---
  if (!packet.timestamp || !packet.nonce || !packet.action || !packet.signature) {
    return false;
  }

  // --- Timestamp window check ---
  const packetTime = new Date(packet.timestamp).getTime();
  const now = Date.now();
  const windowMs = SPA_WINDOW_SECONDS * 1000;

  if (isNaN(packetTime) || Math.abs(now - packetTime) > windowMs) {
    return false;
  }

  // --- Signature verification ---
  const canonical = buildCanonicalPayload(
    packet.timestamp,
    packet.nonce,
    packet.action,
    packet.service,
    packet.params
  );

  const expectedSignature = await computeHmacSha256(canonical, secret);
  return timingSafeEqual(expectedSignature, packet.signature);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Compares two hex strings character by character.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============================================================================
// Shell Command Generation
// ============================================================================

/**
 * Generate a curl-based shell command that transmits a SPA packet to a
 * gateway URL. Useful for scripting and automation outside the browser.
 *
 * @param gatewayUrl - The full URL of the SPA gateway
 * @param action     - The requested action
 * @param service    - Optional target service
 * @param params     - Optional action parameters
 * @param secret     - Shared secret for HMAC signing
 * @returns A shell-ready curl command string
 */
export async function generateSpaShellCommand(
  gatewayUrl: string,
  action: string,
  service?: string,
  params?: Record<string, unknown>,
  secret?: string
): Promise<string> {
  const packet = await createSpaPacket(action, service, params, secret);
  const payload = JSON.stringify(packet);

  // Build curl command with proper escaping
  const escapedPayload = payload.replace(/'/g, "'\\''");

  return `curl -s -X POST '${gatewayUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '${escapedPayload}'`;
}

/**
 * Generate a curl command from a pre-built SPA packet (synchronous version).
 */
export function generateSpaShellCommandFromPacket(
  gatewayUrl: string,
  packet: SPAPacket
): string {
  const payload = JSON.stringify(packet);
  const escapedPayload = payload.replace(/'/g, "'\\''");

  return `curl -s -X POST '${gatewayUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '${escapedPayload}'`;
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse an incoming SPA response from the gateway.
 *
 * Handles both JSON string responses and pre-parsed objects,
 * providing a consistent SPAResponse shape with sensible defaults.
 *
 * @param data - The raw response data (string or object)
 * @returns A normalised SPAResponse object
 */
export function parseSpaResponse(data: unknown): SPAResponse {
  const fallback: SPAResponse = {
    success: false,
    error: 'Invalid or empty response from gateway',
  };

  if (data == null) return fallback;

  // If already an object, validate shape
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    return {
      success: Boolean(obj.success),
      message: typeof obj.message === 'string' ? obj.message : undefined,
      data: typeof obj.data === 'object' && obj.data !== null
        ? (obj.data as Record<string, unknown>)
        : undefined,
      error: typeof obj.error === 'string' ? obj.error : undefined,
      packetId: typeof obj.packetId === 'string' ? obj.packetId : undefined,
      processedAt: typeof obj.processedAt === 'string' ? obj.processedAt : undefined,
    };
  }

  // Try to parse as JSON string
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as Record<string, unknown>;
      return parseSpaResponse(parsed);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

// ============================================================================
// Utility: Encode packet for URL query param
// ============================================================================

/**
 * Encode a SPA packet as a base64url string for use in URL query parameters.
 * This is useful for GET-based SPA where the packet is embedded in the URL.
 */
export function encodeSpaPacketBase64Url(packet: SPAPacket): string {
  const json = JSON.stringify(packet);
  // base64url = base64 with +/ replaced by -_ and trailing = stripped
  if (typeof window !== 'undefined') {
    return btoa(json)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  // Node.js fallback (shouldn't normally hit this in client code)
  return Buffer.from(json).toString('base64url');
}

/**
 * Decode a base64url-encoded SPA packet string back to an SPAPacket object.
 */
export function decodeSpaPacketBase64Url(encoded: string): SPAPacket | null {
  try {
    let base64: string;
    if (typeof window !== 'undefined') {
      // Restore standard base64 padding
      let padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (padded.length % 4 !== 0) padded += '=';
      base64 = padded;
      const json = atob(base64);
      return JSON.parse(json) as SPAPacket;
    }
    // Node.js fallback
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    return JSON.parse(json) as SPAPacket;
  } catch {
    return null;
  }
}