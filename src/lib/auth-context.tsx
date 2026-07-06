/**
 * BABIRYE v10.0.0 — Authentication Context Provider
 *
 * Provides a React context for managing authentication state across
 * the application. Handles login, logout, token storage, automatic
 * token refresh, and session persistence via localStorage.
 *
 * Usage:
 * ```tsx
 * // In layout or root component:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // In any child component:
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { User, LoginResponse } from '@/lib/types';
import { apiPost, apiGet } from '@/lib/api-helpers';
import { ApiClientError } from '@/lib/api-helpers';
import { toast } from '@/hooks/use-toast';
import { useAppStore } from '@/stores/app-store';

// ============================================================================
// Types
// ============================================================================

/** JWT token payload decoded from the token. */
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'session' | 'api';
  iat?: number;
  exp?: number;
}

/** The shape of the authentication context value. */
export interface AuthContextValue {
  /** Currently authenticated user, or null if not logged in. */
  user: User | null;
  /** The current session token. */
  token: string | null;
  /** Whether a user is currently authenticated. */
  isAuthenticated: boolean;
  /** Whether an auth operation (login/logout/refresh) is in progress. */
  isLoading: boolean;
  /** The most recent authentication error, or null. */
  error: string | null;
  /** Perform login with email and password. */
  login: (email: string, password: string) => Promise<boolean>;
  /** Perform logout and clear session. */
  logout: () => Promise<void>;
  /** Manually trigger a token refresh. */
  refreshToken: () => Promise<boolean>;
}

/** Props for the AuthProvider component. */
export interface AuthProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// Constants
// ============================================================================

/** localStorage key for the session token. */
const TOKEN_STORAGE_KEY = 'babirye_session_token';

/** localStorage key for the user data cache. */
const USER_CACHE_KEY = 'babirye_user_cache';

/** How often to check if the token needs refresh (30 seconds). */
const TOKEN_CHECK_INTERVAL_MS = 30_000;

/** Refresh the token this many ms before expiry (5 minutes). */
const REFRESH_AHEAD_MS = 5 * 60 * 1000;

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// Token Helpers
// ============================================================================

/**
 * Decode a JWT token without verification (client-side decode only).
 * Extracts the payload from the middle segment of the token.
 */
function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Handle base64url encoding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired or about to expire.
 */
function isTokenExpired(token: string, aheadMs: number = 0): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  const expiresAt = payload.exp * 1000; // Convert seconds to ms
  return Date.now() + aheadMs >= expiresAt;
}

/**
 * Get the remaining time until token expiry in milliseconds.
 * Returns 0 if already expired or if the token cannot be decoded.
 */
function getTokenTimeToExpiry(token: string): number {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return 0;
  const expiresAt = payload.exp * 1000;
  return Math.max(0, expiresAt - Date.now());
}

/**
 * Store the token and optional user data in localStorage.
 */
function persistSession(token: string, user: User | null): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    }
  } catch {
    // localStorage may be unavailable in some environments
    console.warn('[Auth] Failed to persist session to localStorage');
  }
}

/**
 * Clear all stored session data from localStorage.
 */
function clearPersistedSession(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Load the stored token from localStorage.
 */
function loadStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Load the cached user data from localStorage.
 */
function loadCachedUser(): User | null {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as User;
  } catch {
    return null;
  }
}

// ============================================================================
// Auth Provider Component
// ============================================================================

/**
 * Authentication context provider.
 *
 * Wraps the application and provides authentication state and methods
 * to all child components via the `useAuth()` hook.
 *
 * Features:
 * - Auto-login from stored token on mount
 * - Automatic token refresh before expiry
 * - Login/logout with loading states
 * - Error handling with toast notifications
 * - Zustand store synchronization
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);
  const mountedRef = useRef(true);

  const storeSetUser = useAppStore((s) => s.setUser);

  // Keep mountedRef in sync
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiPost<LoginResponse>('/auth/login', { email, password });

      const sessionUser = response.user ?? response as unknown as LoginResponse;
      const sessionToken = response.token;

      setToken(sessionToken);
      setUser(sessionUser);
      persistSession(sessionToken, sessionUser);
      storeSetUser({
        id: sessionUser.id,
        name: sessionUser.name ?? sessionUser.email,
        email: sessionUser.email,
        role: sessionUser.role,
        clearanceLevel: sessionUser.role === 'admin' ? 5 : sessionUser.role === 'operator' ? 4 : sessionUser.role === 'analyst' ? 3 : 1,
      });

      toast({
        title: 'Welcome back',
        description: `Signed in as ${sessionUser.name ?? sessionUser.email}`,
      });

      return true;
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Login failed. Please try again.';

      setError(message);
      toast({
        title: 'Authentication failed',
        description: message,
        variant: 'destructive',
      });

      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [storeSetUser]);

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Best-effort server-side logout
      if (token) {
        await apiPost('/auth/logout').catch(() => {
          // Ignore errors — we're logging out anyway
        });
      }
    } finally {
      setToken(null);
      setUser(null);
      storeSetUser(null);
      clearPersistedSession();

      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      if (mountedRef.current) {
        setIsLoading(false);
      }

      toast({
        title: 'Signed out',
        description: 'You have been logged out successfully.',
      });
    }
  }, [token, storeSetUser]);

  // -------------------------------------------------------------------------
  // Token Refresh
  // -------------------------------------------------------------------------
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) return false;
    isRefreshingRef.current = true;

    try {
      const response = await apiPost<LoginResponse>('/auth/refresh', {
        currentToken: token,
      });

      const newToken = response.token;
      const refreshedUser = response.user;

      setToken(newToken);
      setUser(refreshedUser);
      persistSession(newToken, refreshedUser);

      return true;
    } catch {
      // Refresh failed — session is likely expired
      setToken(null);
      setUser(null);
      storeSetUser(null);
      clearPersistedSession();

      toast({
        title: 'Session expired',
        description: 'Please sign in again.',
        variant: 'destructive',
      });

      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [token, storeSetUser]);

  // -------------------------------------------------------------------------
  // Auto-login on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = loadStoredToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        clearPersistedSession();
        setIsLoading(false);
        return;
      }

      // Set token immediately from storage
      setToken(storedToken);

      // Try to load cached user data for instant UI
      const cachedUser = loadCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
        storeSetUser({
          id: cachedUser.id,
          name: cachedUser.name ?? cachedUser.email,
          email: cachedUser.email,
          role: cachedUser.role,
          clearanceLevel: cachedUser.role === 'admin' ? 5 : cachedUser.role === 'operator' ? 4 : cachedUser.role === 'analyst' ? 3 : 1,
        });
      }

      // Verify the token with the server
      try {
        const me = await apiGet<User>('/auth/me');
        setToken(storedToken);
        setUser(me);
        persistSession(storedToken, me);
        storeSetUser({
          id: me.id,
          name: me.name ?? me.email,
          email: me.email,
          role: me.role,
          clearanceLevel: me.role === 'admin' ? 5 : me.role === 'operator' ? 4 : me.role === 'analyst' ? 3 : 1,
        });
      } catch {
        // Token is invalid — clear session
        clearPersistedSession();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [storeSetUser]);

  // -------------------------------------------------------------------------
  // Auto-refresh timer
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!token) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      if (!token) return;

      const timeToExpiry = getTokenTimeToExpiry(token);

      // Refresh if expiring within REFRESH_AHEAD_MS
      if (timeToExpiry > 0 && timeToExpiry <= REFRESH_AHEAD_MS) {
        refreshToken();
      } else if (timeToExpiry === 0) {
        // Already expired — log out
        logout();
      }
    }, TOKEN_CHECK_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [token, refreshToken, logout]);

  // -------------------------------------------------------------------------
  // Context value (memoized)
  // -------------------------------------------------------------------------
  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
  }), [user, token, isLoading, error, login, logout, refreshToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access the authentication context from any component within an AuthProvider.
 *
 * @returns The current authentication context value.
 * @throws Error if used outside of an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() must be used within an <AuthProvider>. ' +
      'Wrap your application or layout with <AuthProvider> first.');
  }
  return context;
}

export default AuthContext;