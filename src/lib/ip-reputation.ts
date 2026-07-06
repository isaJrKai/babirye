/**
 * BABIRYE v10.0.0 — IP Reputation Tracker
 *
 * Tracks access attempts per IP address, computes a reputation score (0-100),
 * and automatically blacklists IPs that fall below threshold. Supports both
 * IPv4 and IPv6 addresses.
 *
 * Score starts at 100 and is penalised as follows:
 *   - Failed attempt:  -10
 *   - Blocked attempt:  +5 (the wall blocked it — good)
 *   - Allowed attempt:  0 (neutral)
 *   - Suspicious patterns (rapid-fire, distributed, etc.): -20
 *
 * Auto-blacklist triggers at score 0 OR 10 failed attempts.
 */

// ============================================================================
// Types
// ============================================================================

/** The reputation record for a single IP address. */
export interface IpReputation {
  /** The IP address this record tracks. */
  ip: string;
  /** Current reputation score (0-100). */
  score: number;
  /** Total number of recorded attempts. */
  totalAttempts: number;
  /** Number of blocked attempts (wall blocked it). */
  blockedCount: number;
  /** Number of failed attempts (auth failure, invalid input, etc.). */
  failedCount: number;
  /** Number of suspicious-pattern flags. */
  suspiciousCount: number;
  /** ISO timestamp of the most recent attempt. */
  lastAttemptAt: string | null;
  /** ISO timestamp when this IP was first seen. */
  firstSeenAt: string;
  /** Subnet (first 3 octets for IPv4, /64 prefix for IPv6). */
  subnet: string;
  /** Whether this IP has been blacklisted. */
  isBlacklisted: boolean;
  /** Whether this IP has been whitelisted. */
  isWhitelisted: boolean;
}

/** An individual attempt record for detailed tracking. */
interface AttemptRecord {
  result: 'blocked' | 'allowed' | 'failed' | 'suspicious';
  timestamp: number;
  detail?: string;
}

/** A full reputation report snapshot. */
export interface IpReputationReport {
  /** Total number of unique IPs tracked. */
  totalTracked: number;
  /** Number of blacklisted IPs. */
  blacklisted: number;
  /** Number of whitelisted IPs. */
  whitelisted: number;
  /** Number of IPs with score > 50 (suspicious). */
  suspicious: number;
  /** Aggregated statistics grouped by subnet. */
  bySubnet: Record<string, { count: number; avgScore: number; blacklisted: number }>;
  /** The report generation timestamp. */
  generatedAt: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Starting reputation score for a new IP. */
const INITIAL_SCORE = 100;

/** Points deducted per failed attempt. */
const FAILED_PENALTY = 10;

/** Points added per blocked attempt (wall worked). */
const BLOCKED_BONUS = 5;

/** Points deducted per suspicious pattern detection. */
const SUSPICIOUS_PENALTY = 20;

/** Score at or below which an IP is auto-blacklisted. */
const BLACKLIST_SCORE_THRESHOLD = 0;

/** Number of failed attempts that trigger auto-blacklist. */
const BLACKLIST_FAILED_THRESHOLD = 10;

/** Suspicious score threshold (for getSuspiciousIps). */
const SUSPICIOUS_SCORE_THRESHOLD = 50;

/** Maximum number of attempt records kept per IP. */
const MAX_RECORDS_PER_IP = 500;

/** Default age for cleanup: 7 days. */
const DEFAULT_CLEANUP_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Rapid-fire window: attempts within this many ms are considered "rapid". */
const RAPID_FIRE_WINDOW_MS = 60 * 1000; // 1 minute

/** Number of attempts in the rapid-fire window that triggers suspicious. */
const RAPID_FIRE_THRESHOLD = 30;

// ============================================================================
// IP Reputation Tracker
// ============================================================================

class IpReputationTracker {
  private reputations: Map<string, IpReputation> = new Map();
  private attemptRecords: Map<string, AttemptRecord[]> = new Map();
  private blacklistedIps: Set<string> = new Set();
  private whitelistedIps: Set<string> = new Set();
  private static instance: IpReputationTracker | null = null;

  private constructor() {}

  /**
   * Get the singleton instance.
   * @returns The shared IpReputationTracker instance.
   */
  static getInstance(): IpReputationTracker {
    if (!IpReputationTracker.instance) {
      IpReputationTracker.instance = new IpReputationTracker();
    }
    return IpReputationTracker.instance;
  }

  // ---------------------------------------------------------------------------
  // Core operations
  // ---------------------------------------------------------------------------

  /**
   * Record an access attempt for the given IP.
   * Automatically applies score adjustments and checks for suspicious patterns.
   *
   * @param ip     - The IP address (IPv4 or IPv6).
   * @param result - The result of the attempt.
   */
  recordAttempt(ip: string, result: 'blocked' | 'allowed' | 'failed'): void {
    // Whitelisted IPs are always exempt
    if (this.whitelistedIps.has(ip)) return;

    const now = Date.now();
    let rep = this.getOrCreateReputation(ip);

    // Record the attempt
    const records = this.getOrCreateRecords(ip);
    records.push({ result, timestamp: now });
    if (records.length > MAX_RECORDS_PER_IP) {
      // Keep only the most recent records
      this.attemptRecords.set(ip, records.slice(-MAX_RECORDS_PER_IP));
    }

    // Apply score adjustments
    switch (result) {
      case 'failed':
        rep.score = Math.max(0, rep.score - FAILED_PENALTY);
        rep.failedCount++;
        break;
      case 'blocked':
        rep.score = Math.min(100, rep.score + BLOCKED_BONUS);
        rep.blockedCount++;
        break;
      case 'allowed':
        // Neutral — no score change
        break;
    }

    // Check for suspicious patterns
    if (this.detectSuspiciousPattern(ip)) {
      rep.score = Math.max(0, rep.score - SUSPICIOUS_PENALTY);
      rep.suspiciousCount++;
      records.push({ result: 'suspicious', timestamp: now, detail: 'Rapid-fire pattern detected' });
    }

    rep.totalAttempts++;
    rep.lastAttemptAt = new Date(now).toISOString();

    // Auto-blacklist check
    if (rep.score <= BLACKLIST_SCORE_THRESHOLD || rep.failedCount >= BLACKLIST_FAILED_THRESHOLD) {
      rep.isBlacklisted = true;
      rep.score = 0;
      this.blacklistedIps.add(ip);
    }

    this.reputations.set(ip, rep);
  }

  /**
   * Get the full reputation object for an IP.
   * Returns a default zero-score reputation for unknown IPs.
   *
   * @param ip - The IP address to look up.
   * @returns The IpReputation record.
   */
  getReputation(ip: string): IpReputation {
    const existing = this.reputations.get(ip);
    if (existing) {
      // Return a copy
      return { ...existing };
    }

    // Return a fresh default for unknown IPs
    return {
      ip,
      score: INITIAL_SCORE,
      totalAttempts: 0,
      blockedCount: 0,
      failedCount: 0,
      suspiciousCount: 0,
      lastAttemptAt: null,
      firstSeenAt: new Date().toISOString(),
      subnet: this.extractSubnet(ip),
      isBlacklisted: this.blacklistedIps.has(ip),
      isWhitelisted: this.whitelistedIps.has(ip),
    };
  }

  /**
   * Get just the numeric reputation score for an IP.
   *
   * @param ip - The IP address.
   * @returns A score from 0 to 100.
   */
  getScore(ip: string): number {
    return this.getReputation(ip).score;
  }

  /**
   * Add an IP to the whitelist. Removes from blacklist if present.
   *
   * @param ip - The IP address to whitelist.
   */
  whitelistIp(ip: string): void {
    this.whitelistedIps.add(ip);
    this.blacklistedIps.delete(ip);
    const rep = this.reputations.get(ip);
    if (rep) {
      rep.isWhitelisted = true;
      rep.isBlacklisted = false;
      rep.score = INITIAL_SCORE;
    }
  }

  /**
   * Remove an IP from the whitelist.
   *
   * @param ip - The IP address to un-whitelist.
   */
  unwhitelistIp(ip: string): void {
    this.whitelistedIps.delete(ip);
    const rep = this.reputations.get(ip);
    if (rep) {
      rep.isWhitelisted = false;
    }
  }

  /**
   * Manually blacklist an IP.
   *
   * @param ip - The IP address to blacklist.
   */
  blacklistIp(ip: string): void {
    this.blacklistedIps.add(ip);
    this.whitelistedIps.delete(ip);
    const rep = this.reputations.get(ip);
    if (rep) {
      rep.isBlacklisted = true;
      rep.isWhitelisted = false;
      rep.score = 0;
    }
  }

  /**
   * Manually un-blacklist an IP.
   *
   * @param ip - The IP address to un-blacklist.
   */
  unblacklistIp(ip: string): void {
    this.blacklistedIps.delete(ip);
    const rep = this.reputations.get(ip);
    if (rep) {
      rep.isBlacklisted = false;
      rep.score = Math.max(rep.score, 50); // Restore to at least 50
    }
  }

  /**
   * Get all currently blacklisted IP addresses.
   *
   * @returns Array of blacklisted IP strings.
   */
  getBlacklistedIps(): string[] {
    return [...this.blacklistedIps];
  }

  /**
   * Get all currently whitelisted IP addresses.
   *
   * @returns Array of whitelisted IP strings.
   */
  getWhitelistedIps(): string[] {
    return [...this.whitelistedIps];
  }

  /**
   * Get all IPs with a reputation score above the suspicious threshold.
   *
   * @returns Array of { ip, score } objects sorted descending by score (worst first).
   */
  getSuspiciousIps(): { ip: string; score: number }[] {
    const results: { ip: string; score: number }[] = [];

    for (const [ip, rep] of this.reputations) {
      if (rep.score < SUSPICIOUS_SCORE_THRESHOLD && !rep.isWhitelisted) {
        results.push({ ip, score: rep.score });
      }
    }

    // Sort ascending by score (lowest/most dangerous first)
    results.sort((a, b) => a.score - b.score);
    return results;
  }

  /**
   * Check if an IP is currently blacklisted.
   *
   * @param ip - The IP to check.
   * @returns `true` if blacklisted.
   */
  isBlacklisted(ip: string): boolean {
    return this.blacklistedIps.has(ip);
  }

  /**
   * Check if an IP is currently whitelisted.
   *
   * @param ip - The IP to check.
   * @returns `true` if whitelisted.
   */
  isWhitelisted(ip: string): boolean {
    return this.whitelistedIps.has(ip);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Remove reputation records that haven't been updated within the given age.
   * Never removes blacklisted or whitelisted IPs.
   *
   * @param maxAgeMs - Maximum age in ms before a record is considered stale.
   * @returns The number of records cleaned up.
   */
  async cleanupOldRecords(maxAgeMs?: number): Promise<number> {
    const maxAge = maxAgeMs ?? DEFAULT_CLEANUP_AGE_MS;
    const now = Date.now();
    let cleaned = 0;

    for (const [ip, rep] of this.reputations) {
      // Never clean up blacklisted or whitelisted entries
      if (rep.isBlacklisted || rep.isWhitelisted) continue;

      const lastActivity = rep.lastAttemptAt
        ? new Date(rep.lastAttemptAt).getTime()
        : new Date(rep.firstSeenAt).getTime();

      if (now - lastActivity > maxAge) {
        this.reputations.delete(ip);
        this.attemptRecords.delete(ip);
        cleaned++;
      }
    }

    return cleaned;
  }

  // ---------------------------------------------------------------------------
  // Reporting
  // ---------------------------------------------------------------------------

  /**
   * Generate a full reputation report snapshot.
   *
   * @returns An IpReputationReport with aggregated statistics.
   */
  exportReputationReport(): IpReputationReport {
    let blacklisted = 0;
    let whitelisted = 0;
    let suspicious = 0;
    const bySubnet: Record<string, { count: number; avgScore: number; blacklisted: number }> = {};

    for (const rep of this.reputations.values()) {
      if (rep.isBlacklisted) blacklisted++;
      if (rep.isWhitelisted) whitelisted++;
      if (rep.score < SUSPICIOUS_SCORE_THRESHOLD && !rep.isWhitelisted) suspicious++;

      // Aggregate by subnet
      const subnet = rep.subnet;
      if (!bySubnet[subnet]) {
        bySubnet[subnet] = { count: 0, avgScore: 0, blacklisted: 0 };
      }
      const agg = bySubnet[subnet];
      agg.count++;
      agg.avgScore += rep.score;
      if (rep.isBlacklisted) agg.blacklisted++;
    }

    // Compute average scores per subnet
    for (const agg of Object.values(bySubnet)) {
      agg.avgScore = agg.count > 0 ? Math.round(agg.avgScore / agg.count) : 0;
    }

    return {
      totalTracked: this.reputations.size,
      blacklisted,
      whitelisted,
      suspicious,
      bySubnet,
      generatedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Get existing reputation or create a fresh one.
   */
  private getOrCreateReputation(ip: string): IpReputation {
    let rep = this.reputations.get(ip);
    if (!rep) {
      rep = {
        ip,
        score: INITIAL_SCORE,
        totalAttempts: 0,
        blockedCount: 0,
        failedCount: 0,
        suspiciousCount: 0,
        lastAttemptAt: null,
        firstSeenAt: new Date().toISOString(),
        subnet: this.extractSubnet(ip),
        isBlacklisted: false,
        isWhitelisted: false,
      };
      this.reputations.set(ip, rep);
    }
    return rep;
  }

  /**
   * Get or create the attempt record array for an IP.
   */
  private getOrCreateRecords(ip: string): AttemptRecord[] {
    let records = this.attemptRecords.get(ip);
    if (!records) {
      records = [];
      this.attemptRecords.set(ip, records);
    }
    return records;
  }

  /**
   * Detect suspicious patterns such as rapid-fire attempts.
   *
   * @returns `true` if a suspicious pattern is detected.
   */
  private detectSuspiciousPattern(ip: string): boolean {
    const records = this.attemptRecords.get(ip);
    if (!records || records.length < RAPID_FIRE_THRESHOLD) return false;

    const now = Date.now();
    const windowStart = now - RAPID_FIRE_WINDOW_MS;

    // Count recent attempts
    let recentCount = 0;
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].timestamp >= windowStart) {
        recentCount++;
      } else {
        break; // Records are sorted by time
      }
    }

    return recentCount >= RAPID_FIRE_THRESHOLD;
  }

  /**
   * Extract a subnet representation from an IP address.
   * For IPv4: first 3 octets (e.g. "192.168.1").
   * For IPv6: /64 prefix (first 4 hextets).
   */
  private extractSubnet(ip: string): string {
    if (ip.includes(':')) {
      // IPv6 — take first 4 groups (64-bit prefix)
      const groups = ip.split(':');
      const prefix = groups.slice(0, 4).join(':');
      return `${prefix}::/64`;
    }

    // IPv4 — take first 3 octets
    const octets = ip.split('.');
    if (octets.length === 4) {
      return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
    }

    // Fallback
    return ip;
  }
}

// ============================================================================
// Export singleton accessor
// ============================================================================

/** The global IpReputationTracker singleton instance. */
export const ipReputationTracker = IpReputationTracker.getInstance();

export default ipReputationTracker;