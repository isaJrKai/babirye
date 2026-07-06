/**
 * BABIRYE v10.0.0 — Server-Side Session Manager
 *
 * In-memory session management with TTL-based expiry, per-session rate limiting,
 * max session enforcement per user, and session event logging.
 *
 * Designed for API route integration. Uses a singleton pattern to ensure
 * a single authoritative session store across the server process.
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

/** Metadata attached to a session at creation time. */
export interface SessionMetadata {
  /** Client IP address. */
  ip?: string;
  /** Client User-Agent string. */
  userAgent?: string;
  /** Arbitrary extra key-value pairs. */
  [key: string]: unknown;
}

/** A tracked session event for audit/logging purposes. */
export interface SessionEvent {
  sessionId: string;
  userId: string;
  type: 'created' | 'validated' | 'destroyed' | 'expired' | 'rate_limited' | 'evicted';
  timestamp: string;
  details?: string;
}

/** Full session object stored in memory. */
export interface Session {
  /** Unique session identifier. */
  id: string;
  /** The user this session belongs to. */
  userId: string;
  /** ISO timestamp of when the session was created. */
  createdAt: string;
  /** ISO timestamp of last recorded activity. */
  lastActivityAt: string;
  /** ISO timestamp when the session expires. */
  expiresAt: string;
  /** Request timestamps for sliding-window rate limiting. */
  requestTimestamps: number[];
  /** Arbitrary metadata attached at creation. */
  metadata: SessionMetadata;
}

/** Summary snapshot of the session manager's current state. */
export interface SessionStats {
  activeSessions: number;
  activeUsers: number;
  totalSessionsEverCreated: number;
  totalSessionsDestroyed: number;
  totalSessionsExpired: number;
  totalRateLimited: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Default TTL for a session: 24 hours. */
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Maximum number of concurrent sessions per user. */
const MAX_SESSIONS_PER_USER = 5;

/** Rate limit: max requests per rolling window. */
const RATE_LIMIT_MAX_REQUESTS = 100;

/** Rate limit: rolling window duration in milliseconds (10 minutes). */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/** Maximum event log entries retained in memory. */
const MAX_EVENT_LOG_SIZE = 1000;

// ============================================================================
// Singleton Session Manager
// ============================================================================

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessionIndex: Map<string, Set<string>> = new Map();
  private eventLog: SessionEvent[] = [];
  private totalCreated = 0;
  private totalDestroyed = 0;
  private totalExpired = 0;
  private totalRateLimited = 0;
  private static instance: SessionManager | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of SessionManager.
   * @returns The shared SessionManager instance.
   */
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // ---------------------------------------------------------------------------
  // Core CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new session for the given user.
   * Enforces MAX_SESSIONS_PER_USER by evicting the oldest session if needed.
   *
   * @param userId   - The user to create a session for.
   * @param metadata - Optional metadata (IP, user-agent, etc.).
   * @returns The newly created Session object.
   */
  createSession(userId: string, metadata?: Record<string, unknown>): Session {
    // Enforce max sessions per user — evict oldest if at capacity
    this.enforceMaxSessions(userId);

    const now = Date.now();
    const session: Session = {
      id: randomUUID(),
      userId,
      createdAt: new Date(now).toISOString(),
      lastActivityAt: new Date(now).toISOString(),
      expiresAt: new Date(now + DEFAULT_SESSION_TTL_MS).toISOString(),
      requestTimestamps: [now],
      metadata: {
        ip: (metadata?.ip as string) ?? null,
        userAgent: (metadata?.userAgent as string) ?? null,
        ...metadata,
      },
    };

    this.sessions.set(session.id, session);

    // Update user → session index
    let userSessions = this.userSessionIndex.get(userId);
    if (!userSessions) {
      userSessions = new Set();
      this.userSessionIndex.set(userId, userSessions);
    }
    userSessions.add(session.id);

    this.totalCreated++;
    this.logEvent(session.id, userId, 'created', `IP: ${session.metadata.ip ?? 'unknown'}`);

    return session;
  }

  /**
   * Validate that a session exists, belongs to the given user, and has not expired.
   * Also updates last activity and records a request for rate limiting.
   *
   * @param sessionId - The session ID to validate.
   * @param userId    - The user who claims to own this session.
   * @returns The Session if valid, or null if invalid/expired.
   */
  validateSession(sessionId: string, userId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Ownership check
    if (session.userId !== userId) return null;

    // Expiry check
    if (Date.now() > new Date(session.expiresAt).getTime()) {
      this.destroySession(sessionId);
      return null;
    }

    // Rate limit check
    if (!this.checkRateLimit(session)) {
      this.totalRateLimited++;
      this.logEvent(sessionId, userId, 'rate_limited', 'Rate limit exceeded');
      return null;
    }

    // Update activity
    this.updateSessionActivity(sessionId);
    this.logEvent(sessionId, userId, 'validated');

    return session;
  }

  /**
   * Destroy a specific session by ID.
   *
   * @param sessionId - The session ID to destroy.
   * @returns `true` if the session was found and destroyed, `false` otherwise.
   */
  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);
    this.totalDestroyed++;

    // Remove from user index
    const userSessions = this.userSessionIndex.get(session.userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessionIndex.delete(session.userId);
      }
    }

    this.logEvent(sessionId, session.userId, 'destroyed');
    return true;
  }

  /**
   * Retrieve a session by ID without performing validation or activity updates.
   *
   * @param sessionId - The session ID to look up.
   * @returns The Session if found, or null.
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Return a shallow copy to prevent external mutation
    return { ...session, metadata: { ...session.metadata } };
  }

  /**
   * Update the last activity timestamp for a session.
   *
   * @param sessionId - The session ID to update.
   */
  updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.lastActivityAt = new Date().toISOString();
    session.requestTimestamps.push(Date.now());
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Remove all expired sessions from the store.
   *
   * @param maxAgeMs - Override the default TTL for expiry calculation.
   * @returns The number of sessions that were cleaned up.
   */
  async cleanupExpiredSessions(maxAgeMs?: number): Promise<number> {
    const ttl = maxAgeMs ?? DEFAULT_SESSION_TTL_MS;
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions) {
      const age = now - new Date(session.createdAt).getTime();
      if (age > ttl || now > new Date(session.expiresAt).getTime()) {
        this.sessions.delete(sessionId);

        // Clean up user index
        const userSessions = this.userSessionIndex.get(session.userId);
        if (userSessions) {
          userSessions.delete(sessionId);
          if (userSessions.size === 0) {
            this.userSessionIndex.delete(session.userId);
          }
        }

        this.totalExpired++;
        this.logEvent(sessionId, session.userId, 'expired');
        cleaned++;
      }
    }

    return cleaned;
  }

  // ---------------------------------------------------------------------------
  // Monitoring
  // ---------------------------------------------------------------------------

  /**
   * Get the current count of active (non-expired) sessions.
   *
   * @returns The number of active sessions.
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get the number of active sessions for a specific user.
   *
   * @param userId - The user to count sessions for.
   * @returns The number of active sessions.
   */
  getUserSessionCount(userId: string): number {
    return this.userSessionIndex.get(userId)?.size ?? 0;
  }

  /**
   * Get a statistical snapshot of the session manager.
   *
   * @returns A SessionStats object with current metrics.
   */
  getStats(): SessionStats {
    return {
      activeSessions: this.sessions.size,
      activeUsers: this.userSessionIndex.size,
      totalSessionsEverCreated: this.totalCreated,
      totalSessionsDestroyed: this.totalDestroyed,
      totalSessionsExpired: this.totalExpired,
      totalRateLimited: this.totalRateLimited,
    };
  }

  /**
   * Get all session event log entries.
   *
   * @returns A copy of the event log array.
   */
  getEventLog(): SessionEvent[] {
    return [...this.eventLog];
  }

  /**
   * Get all session IDs for a given user.
   *
   * @param userId - The user to look up sessions for.
   * @returns Array of session IDs.
   */
  getUserSessionIds(userId: string): string[] {
    const set = this.userSessionIndex.get(userId);
    return set ? [...set] : [];
  }

  /**
   * Destroy all sessions for a given user (e.g. on password change).
   *
   * @param userId - The user whose sessions should all be destroyed.
   * @returns The number of sessions destroyed.
   */
  destroyAllUserSessions(userId: string): number {
    const sessionIds = this.getUserSessionIds(userId);
    for (const sid of sessionIds) {
      this.sessions.delete(sid);
      this.totalDestroyed++;
      this.logEvent(sid, userId, 'destroyed', 'Bulk destroy (all user sessions)');
    }
    this.userSessionIndex.delete(userId);
    return sessionIds.length;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Enforce MAX_SESSIONS_PER_USER by evicting the oldest session.
   */
  private enforceMaxSessions(userId: string): void {
    const userSessions = this.userSessionIndex.get(userId);
    if (!userSessions || userSessions.size < MAX_SESSIONS_PER_USER) return;

    // Find the oldest session for this user
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const sid of userSessions) {
      const session = this.sessions.get(sid);
      if (session) {
        const created = new Date(session.createdAt).getTime();
        if (created < oldestTime) {
          oldestTime = created;
          oldestId = sid;
        }
      }
    }

    if (oldestId) {
      this.sessions.delete(oldestId);
      userSessions.delete(oldestId);
      this.logEvent(oldestId, userId, 'evicted', 'Evicted oldest session to enforce max sessions limit');
    }
  }

  /**
   * Check if the session is within its rate limit.
   * Prunes stale request timestamps and checks against the rolling window.
   */
  private checkRateLimit(session: Session): boolean {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Prune timestamps outside the window
    session.requestTimestamps = session.requestTimestamps.filter((ts) => ts > windowStart);

    return session.requestTimestamps.length < RATE_LIMIT_MAX_REQUESTS;
  }

  /**
   * Append an event to the in-memory event log, trimming if over capacity.
   */
  private logEvent(sessionId: string, userId: string, type: SessionEvent['type'], details?: string): void {
    this.eventLog.push({
      sessionId,
      userId,
      type,
      timestamp: new Date().toISOString(),
      details,
    });

    // Trim log if over capacity
    if (this.eventLog.length > MAX_EVENT_LOG_SIZE) {
      this.eventLog = this.eventLog.slice(-MAX_EVENT_LOG_SIZE);
    }
  }
}

// ============================================================================
// Export singleton accessor
// ============================================================================

/** The global SessionManager singleton instance. */
export const sessionManager = SessionManager.getInstance();

export default sessionManager;