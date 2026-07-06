// ============================================================================
// BABIRYE - In-Memory Event Bus for Decoupled Module Communication
// Version: 10.0.0 | Edition: Titanium Ultra + VIP Protection
// ============================================================================

/**
 * Type-safe event map interface.
 * Extend this interface to add new typed events to the system.
 *
 * @example
 * ```ts
 * interface MyEvents extends EventMap {
 *   'agent:updated': { agentId: string; status: string };
 *   'alert:critical': { alertId: string; severity: 'critical' };
 *   'sensor:anomaly': { sensorId: string; score: number };
 * }
 * ```
 */
export interface EventMap {
  [event: string]: unknown;
}

/** Listener function type — receives the event payload and event name. */
export type EventListener<T = unknown> = (payload: T, eventName: string) => void;

/** Internal listener entry stored with metadata. */
interface ListenerEntry<T = unknown> {
  listener: EventListener<T>;
  once: boolean;
  rawPattern: string;
  isWildcard: boolean;
}

/**
 * In-memory, type-safe event bus for decoupled cross-module communication.
 *
 * Features:
 * - Type-safe event names via generic EventMap
 * - Synchronous and asynchronous listener support
 * - Wildcard event matching (e.g., `'agent:*'`, `'*'`)
 * - Listener count management with configurable max
 * - One-time listener support via `once()`
 * - Cleanup utility for batch listener removal
 * - Zustand store bridge for cross-component reactivity
 *
 * @example
 * ```ts
 * import { eventBus } from '@/lib/event-bus';
 *
 * // Typed listener
 * eventBus.on('agent:updated', (payload) => {
 *   console.log(`Agent ${payload.agentId} is now ${payload.status}`);
 * });
 *
 * // Emit event
 * eventBus.emit('agent:updated', { agentId: 'abc123', status: 'running' });
 *
 * // Wildcard listener
 * eventBus.on('alert:*', (payload, name) => {
 *   console.log(`Received alert event: ${name}`, payload);
 * });
 *
 * // One-time listener
 * eventBus.once('system:ready', () => {
 *   console.log('System initialized');
 * });
 *
 * // Cleanup all listeners for a specific event
 * eventBus.off('agent:updated');
 *
 * // Bridge to zustand store
 * eventBus.bridgeToStore(store, (event, payload) => {
 *   if (event === 'agent:status') store.setState({ agentStatus: payload });
 * });
 * ```
 */
export class EventBus<TEventMap extends EventMap = EventMap> {
  private listeners = new Map<string, ListenerEntry[]>();
  private maxListenersPerEvent = 50;

  // -------------------------------------------------------------------------
  // Core API
  // -------------------------------------------------------------------------

  /**
   * Register an event listener.
   * Supports wildcard patterns — `'*'` matches all events, `'prefix:*'`
   * matches all events starting with `prefix:`.
   *
   * @param event - Event name or wildcard pattern
   * @param listener - Callback function invoked when the event fires
   * @returns Disposer function that removes this specific listener
   */
  on<K extends keyof TEventMap & string>(
    event: K | `*` | `${string}:*`,
    listener: EventListener<TEventMap[K]>
  ): () => void {
    this.ensureListenerSlot(event);
    const entry: ListenerEntry = {
      listener: listener as EventListener,
      once: false,
      rawPattern: event,
      isWildcard: event === '*' || event.endsWith(':*'),
    };
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), entry]);
    return () => this.removeListener(event, listener as unknown as EventListener);
  }

  /**
   * Register a one-time event listener that auto-removes after the first invocation.
   *
   * @param event - Event name or wildcard pattern
   * @param listener - Callback invoked at most once
   * @returns Disposer function
   */
  once<K extends keyof TEventMap & string>(
    event: K | `*` | `${string}:*`,
    listener: EventListener<TEventMap[K]>
  ): () => void {
    this.ensureListenerSlot(event);
    const entry: ListenerEntry = {
      listener: listener as EventListener,
      once: true,
      rawPattern: event,
      isWildcard: event === '*' || event.endsWith(':*'),
    };
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), entry]);
    return () => this.removeListener(event, listener as unknown as EventListener);
  }

  /**
   * Emit an event, invoking all matching listeners (exact + wildcards).
   * If a listener returns a Promise, it is awaited asynchronously.
   *
   * @param event - The event name to emit
   * @param payload - Data to pass to listeners
   */
  emit<K extends keyof TEventMap & string>(event: K, payload: TEventMap[K]): void {
    // Collect matching listener entries (copy to avoid mutation during iteration)
    const entries = this.collectMatchingEntries(event);

    for (const { entry, matchedPattern } of entries) {
      try {
        const result = entry.listener(payload, event) as unknown;
        // Handle async listeners without blocking the emitter
        if (result && typeof result === 'object' && 'then' in result) {
          // Async listener errors are caught and logged without blocking the emitter
          Promise.resolve(result).catch((err: unknown) => {
            console.error(
              `[EventBus] Async listener error on "${event}" (pattern: ${matchedPattern}):`,
              err
            );
          });
        }
      } catch (err: unknown) {
        console.error(
          `[EventBus] Sync listener error on "${event}" (pattern: ${matchedPattern}):`,
          err
        );
      }

      // Auto-remove one-time listeners
      if (entry.once) {
        this.removeListener(matchedPattern, entry.listener as EventListener);
      }
    }
  }

  /**
   * Emit an event and wait for all async listeners to complete.
   *
   * @param event - The event name to emit
   * @param payload - Data to pass to listeners
   * @returns Promise that resolves when all listeners complete
   */
  async emitAsync<K extends keyof TEventMap & string>(
    event: K,
    payload: TEventMap[K]
  ): Promise<void> {
    const entries = this.collectMatchingEntries(event);
    const promises = entries.map(async ({ entry, matchedPattern }) => {
      try {
        const result = entry.listener(payload, event) as unknown;
        if (result && typeof result === 'object' && 'then' in result) await Promise.resolve(result);
      } catch (err: unknown) {
        console.error(
          `[EventBus] Async listener error on "${event}" (pattern: ${matchedPattern}):`,
          err
        );
      }
      if (entry.once) {
        this.removeListener(matchedPattern, entry.listener as EventListener);
      }
    });
    await Promise.allSettled(promises);
  }

  /**
   * Remove listener(s) for a specific event.
   * If no listener is provided, all listeners for that event are removed.
   *
   * @param event - Event name or wildcard pattern
   * @param listener - Specific listener to remove (optional)
   */
  off<K extends keyof TEventMap & string>(
    event: K | `*` | `${string}:*`,
    listener?: EventListener<TEventMap[K]>
  ): void {
    if (!listener) {
      this.listeners.delete(event);
      return;
    }
    this.removeListener(event, listener as unknown as EventListener);
  }

  // -------------------------------------------------------------------------
  // Listener Management
  // -------------------------------------------------------------------------

  /**
   * Get the number of listeners registered for a specific event pattern.
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * Get the total number of all registered listeners across all events.
   */
  totalListenerCount(): number {
    let count = 0;
    for (const entries of this.listeners.values()) {
      count += entries.length;
    }
    return count;
  }

  /**
   * Get or set the maximum number of listeners allowed per event.
   * Warns in development if the limit is exceeded.
   */
  getMaxListeners(): number {
    return this.maxListenersPerEvent;
  }

  setMaxListeners(n: number): this {
    if (n < 1) throw new Error('[EventBus] Max listeners must be at least 1');
    this.maxListenersPerEvent = n;
    return this;
  }

  /**
   * Get all registered event names (patterns).
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Remove all listeners for all events.
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  // -------------------------------------------------------------------------
  // Zustand Store Bridge
  // -------------------------------------------------------------------------

  /**
   * Bridge events to a Zustand store, enabling cross-component reactivity
   * driven by the event bus.
   *
   * @param store - A Zustand store instance (must have `.setState`)
   * @param handler - Maps incoming events to partial state updates
   * @returns Cleanup function that removes the bridge listener
   *
   * @example
   * ```ts
   * const cleanup = eventBus.bridgeToStore(useDashboardStore, (event, payload) => {
   *   switch (event) {
   *     case 'task:update':      return { tasks: payload };
   *     case 'alert:new':        return { alerts: payload };
   *     case 'sensor:reading':   return { sensorData: payload };
   *   }
   * });
   * // Later: cleanup();
   * ```
   */
  bridgeToStore(
    store: { setState: (partial: Record<string, unknown>) => void; getState: () => Record<string, unknown> },
    handler: (event: string, payload: unknown) => Record<string, unknown> | void
  ): () => void {
    const listener: EventListener = (payload, eventName) => {
      const partial = handler(eventName, payload);
      if (partial && typeof partial === 'object') {
        store.setState(partial);
      }
    };
    return this.on('*', listener);
  }

  // -------------------------------------------------------------------------
  // Cleanup Utility
  // -------------------------------------------------------------------------

  /**
   * Create a cleanup scope that tracks disposers and removes all of them
   * when `dispose()` is called. Useful in React `useEffect`.
   *
   * @example
   * ```ts
   * useEffect(() => {
   *   const cleanup = eventBus.createCleanupScope();
   *   cleanup.track(eventBus.on('agent:updated', handler));
   *   cleanup.track(eventBus.on('task:completed', handler2));
   *   return () => cleanup.dispose();
   * }, []);
   * ```
   */
  createCleanupScope(): { track: (disposer: () => void) => void; dispose: () => void } {
    const disposers: (() => void)[] = [];
    return {
      track: (disposer) => disposers.push(disposer),
      dispose: () => {
        for (const d of disposers) d();
        disposers.length = 0;
      },
    };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  /** Collect all listener entries that match a given event name. */
  private collectMatchingEntries(event: string): { entry: ListenerEntry; matchedPattern: string }[] {
    const results: { entry: ListenerEntry; matchedPattern: string }[] = [];

    // 1. Exact match
    const exactEntries = this.listeners.get(event);
    if (exactEntries) {
      for (const entry of exactEntries) {
        results.push({ entry, matchedPattern: event });
      }
    }

    // 2. Wildcard patterns — iterate all keys that contain '*'
    for (const [pattern, entries] of this.listeners) {
      if (pattern === event) continue; // already handled
      if (!pattern.includes('*')) continue;
      if (this.wildcardMatch(pattern, event)) {
        for (const entry of entries) {
          results.push({ entry, matchedPattern: pattern });
        }
      }
    }

    return results;
  }

  /** Check if a wildcard pattern matches an event name. */
  private wildcardMatch(pattern: string, event: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -1); // e.g., "agent:"
      return event.startsWith(prefix);
    }
    // Fallback: convert simple glob-like pattern to regex
    const regexStr = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    try {
      return new RegExp(`^${regexStr}$`).test(event);
    } catch {
      return false;
    }
  }

  /** Remove a specific listener from a specific pattern. */
  private removeListener(event: string, listener: EventListener): void {
    const entries = this.listeners.get(event);
    if (!entries) return;
    const filtered = entries.filter((e) => e.listener !== listener);
    if (filtered.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, filtered);
    }
  }

  /** Warn if max listeners is about to be exceeded. */
  private ensureListenerSlot(event: string): void {
    const current = this.listeners.get(event)?.length ?? 0;
    if (current >= this.maxListenersPerEvent) {
      console.warn(
        `[EventBus] Max listeners (${this.maxListenersPerEvent}) reached for "${event}". ` +
        `Use setMaxListeners() to increase the limit.`
      );
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/** Global singleton event bus instance. */
export const eventBus = new EventBus();

/**
 * Declare module augmentation to allow consumers to extend the EventMap.
 *
 * @example
 * ```ts
 * // In a .d.ts or at module top-level:
 * declare module '@/lib/event-bus' {
 *   interface EventMap {
 *     'agent:status': { agentId: string; status: string };
 *     'vip:sos': { vipId: string; coords: string };
 *   }
 * }
 * ```
 */
export type { EventListener as EventBusListener };