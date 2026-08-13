/**
 * BABIRYE v10.0.0 — Authentication & Authorization Module
 * Handles password hashing, JWT tokens, API tokens, rate limiting, and session management.
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';

// ============================================================================
// CONSTANTS
// ============================================================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.BABIRYE_JWT_SECRET || 'fallback-dev-only-not-for-production'
);
if (!process.env.BABIRYE_JWT_SECRET) {
  console.warn('[AUTH] WARNING: Using fallback JWT secret. Set BABIRYE_JWT_SECRET in production!');
}
const BCRYPT_ROUNDS = 12;
const API_TOKEN_TTL_DEFAULT = 28800; // 8 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ============================================================================
// IN-MEMORY RATE LIMITING & LOCKOUT
// ============================================================================

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function getRateLimitEntry(key: string): RateLimitEntry {
  const existing = rateLimitMap.get(key);
  if (existing) {
    // Check if lockout expired
    if (existing.lockedUntil && Date.now() > existing.lockedUntil) {
      return { attempts: 0, firstAttemptAt: Date.now(), lockedUntil: null };
    }
    // Reset window after 15 minutes of no attempts
    if (Date.now() - existing.firstAttemptAt > LOCKOUT_DURATION_MS && !existing.lockedUntil) {
      return { attempts: 0, firstAttemptAt: Date.now(), lockedUntil: null };
    }
    return existing;
  }
  return { attempts: 0, firstAttemptAt: Date.now(), lockedUntil: null };
}

function checkRateLimit(email: string): { allowed: boolean; lockedUntil: number | null; remainingAttempts: number } {
  const entry = getRateLimitEntry(email.toLowerCase());
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { allowed: false, lockedUntil: entry.lockedUntil, remainingAttempts: 0 };
  }
  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
    entry.lockedUntil = lockUntil;
    rateLimitMap.set(email.toLowerCase(), entry);
    return { allowed: false, lockedUntil: lockUntil, remainingAttempts: 0 };
  }
  return { allowed: true, lockedUntil: null, remainingAttempts: MAX_FAILED_ATTEMPTS - entry.attempts };
}

function recordFailedAttempt(email: string): void {
  const entry = getRateLimitEntry(email.toLowerCase());
  entry.attempts += 1;
  rateLimitMap.set(email.toLowerCase(), entry);
}

function resetRateLimit(email: string): void {
  rateLimitMap.delete(email.toLowerCase());
}

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT TOKEN MANAGEMENT
// ============================================================================

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenId?: string;
  type: 'session' | 'api';
  iat?: number;
  exp?: number;
}

export async function createSessionToken(user: { id: string; email: string; role: string }, ttlMs: number = 86400000): Promise<string> {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'session',
  };
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + Math.floor(ttlMs / 1000))
    .setSubject(user.id)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'session') return null;
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function createApiToken(userId: string, name: string, purpose: string = '', ttlSeconds: number = API_TOKEN_TTL_DEFAULT): Promise<string> {
  const tokenId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const rawToken = `bbr_${tokenId}`;
  const tokenHash = await hashPassword(rawToken);

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await db.apiToken.create({
    data: {
      userId,
      name,
      purpose,
      tokenHash,
      ttlSeconds,
      expiresAt,
    },
  });

  return rawToken;
}

export async function verifyApiToken(token: string): Promise<{ valid: boolean; payload: JwtPayload | null; error?: string }> {
  if (!token.startsWith('bbr_')) {
    return { valid: false, payload: null, error: 'Invalid token format' };
  }

  // Find the token by checking all non-revoked tokens for this user
  // We need to compare hashes, so we get all active tokens and check each
  const activeTokens = await db.apiToken.findMany({
    where: { isRevoked: false, expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
  });

  for (const tokenRecord of activeTokens) {
    const isValid = await bcrypt.compare(token, tokenRecord.tokenHash);
    if (isValid) {
      if (!tokenRecord.user.isActive) {
        return { valid: false, payload: null, error: 'User account is disabled' };
      }
      // Update last used
      await db.apiToken.update({
        where: { id: tokenRecord.id },
        data: { lastUsedAt: new Date() },
      });

      const payload: JwtPayload = {
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        tokenId: tokenRecord.id,
        type: 'api',
      };
      return { valid: true, payload };
    }
  }

  return { valid: false, payload: null, error: 'Token not found or expired' };
}

export async function revokeToken(tokenId: string, userId: string): Promise<boolean> {
  try {
    await db.apiToken.updateMany({
      where: { id: tokenId, userId },
      data: { isRevoked: true },
    });
    return true;
  } catch {
    return false;
  }
}

export async function revokeAllUserTokens(userId: string): Promise<number> {
  const result = await db.apiToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
  return result.count;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function createUser(
  email: string,
  password: string,
  name: string | null = null,
  role: string = 'analyst'
) {
  const passwordHash = await hashPassword(password);
  return db.user.create({
    data: { email: email.toLowerCase(), passwordHash, name, role },
  });
}

export async function verifyCredentials(email: string, password: string) {
  const rateCheck = checkRateLimit(email);
  if (!rateCheck.allowed) {
    const lockMinutes = Math.ceil((rateCheck.lockedUntil! - Date.now()) / 60000);
    return {
      success: false,
      error: `Account locked due to too many failed attempts. Try again in ${lockMinutes} minutes.`,
      remainingAttempts: 0,
    };
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) {
    recordFailedAttempt(email);
    return { success: false, error: 'Invalid credentials', remainingAttempts: rateCheck.remainingAttempts - 1 };
  }

  if (!user.isActive) {
    return { success: false, error: 'Account is disabled', remainingAttempts: 0 };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const lockMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { success: false, error: `Account locked. Try again in ${lockMinutes} minutes.`, remainingAttempts: 0 };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    recordFailedAttempt(email);
    const newAttempts = getRateLimitEntry(email).attempts;
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      await db.user.update({
        where: { id: user.id },
        data: { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS), failedAttempts: newAttempts },
      });
    }
    return { success: false, error: 'Invalid credentials', remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts };
  }

  // Success - reset rate limit
  resetRateLimit(email);
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedAttempts: 0, lockedUntil: null },
  });

  return { success: true, user };
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
}

export async function getAllUsers() {
  return db.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateUserRole(userId: string, role: string) {
  return db.user.update({ where: { id: userId }, data: { role } });
}

export async function toggleUserActive(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return db.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
}

// ============================================================================
// API TOKEN MANAGEMENT
// ============================================================================

export async function listUserTokens(userId: string) {
  return db.apiToken.findMany({
    where: { userId },
    select: { id: true, name: true, purpose: true, isRevoked: true, createdAt: true, expiresAt: true, lastUsedAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// EXTRACT TOKEN FROM REQUEST
// ============================================================================

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export async function authenticateRequest(authHeader: string | null): Promise<{ authenticated: boolean; payload: JwtPayload | null; error?: string }> {
  // DEV BYPASS: always return admin-authenticated
  return {
    authenticated: true,
    payload: {
      userId: 'dev-bypass-admin',
      email: 'admin@babirye.local',
      role: 'admin',
      type: 'session',
    },
  };

  /* Original auth logic — preserved for production re-enablement
  const token = extractBearerToken(authHeader);
  if (!token) return { authenticated: false, payload: null, error: 'No authorization token provided' };

  // Try session token first
  const sessionPayload = await verifySessionToken(token);
  if (sessionPayload) return { authenticated: true, payload: sessionPayload };

  // Try API token
  const apiResult = await verifyApiToken(token);
  if (apiResult.valid && apiResult.payload) return { authenticated: true, payload: apiResult.payload };

  return { authenticated: false, payload: null, error: apiResult.error || 'Invalid or expired token' };
  */}
