/**
 * BABIRYE v10.0.0 — Object Manipulation Utilities
 *
 * Type-safe utility functions for common object operations:
 * pick, omit, deep clone, deep merge, null removal, and JSON helpers.
 */

// ============================================================================
// Pick & Omit
// ============================================================================

/**
 * Pick a subset of keys from an object.
 * Returns a partial object with only the specified keys.
 *
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // => { a: 1, c: 3 }
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from an object.
 * Returns a new object without the specified keys.
 *
 * @example
 * omit({ a: 1, b: 2, c: 3 }, ['b']) // => { a: 1, c: 3 }
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const keySet = new Set<keyof T>(keys);
  const result = {} as Omit<T, K>;
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (!keySet.has(key)) {
      (result as Record<keyof T, unknown>)[key] = obj[key];
    }
  }
  return result;
}

// ============================================================================
// Deep clone
// ============================================================================

/**
 * Create a deep clone of a value using `structuredClone`.
 * Falls back to JSON round-trip for environments without `structuredClone`.
 *
 * @example
 * const original = { a: { b: [1, 2, 3] } };
 * const clone = deepClone(original);
 * clone.a.b.push(4); // does not affect original
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  // Fallback: JSON round-trip (loses functions, symbols, undefined, etc.)
  return JSON.parse(JSON.stringify(obj)) as T;
}

// ============================================================================
// Deep merge
// ============================================================================

/**
 * Deep merge one or more source objects into a target object.
 * Arrays and primitives in sources replace those in the target.
 * Plain objects are merged recursively.
 *
 * @example
 * mergeDeep({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 })
 * // => { a: 1, b: { c: 2, d: 3 }, e: 4 }
 */
export function mergeDeep<T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Record<string, unknown>>
): T {
  const result = deepClone(target);

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    for (const key of Object.keys(source) as Array<keyof Record<string, unknown>>) {
      const sourceVal = source[key];
      const targetVal = result[key as keyof T];

      if (
        sourceVal &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        // Both are plain objects — recurse
        (result as Record<string, unknown>)[key as string] = mergeDeep(
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>
        );
      } else {
        // Primitive, array, or null — replace
        (result as Record<string, unknown>)[key as string] = sourceVal;
      }
    }
  }

  return result;
}

// ============================================================================
// Remove undefined / null values
// ============================================================================

/**
 * Remove keys with `undefined` values from an object.
 * Returns a new object with only defined, non-null values.
 *
 * @example
 * removeUndefined({ a: 1, b: undefined, c: null, d: 'hello' })
 * // => { a: 1, d: 'hello' }
 */
export function removeUndefined<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: NonNullable<T[K]> } {
  const result = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result as { [K in keyof T]: NonNullable<T[K]> };
}

// ============================================================================
// Empty check
// ============================================================================

/**
 * Check if an object has no own enumerable properties.
 * Returns `true` for `{}`, `false` for `{ a: undefined }` (has a key).
 */
export function isEmpty(obj: object): boolean {
  if (obj === null || obj === undefined) return true;
  return Object.keys(obj).length === 0;
}

// ============================================================================
// Null guard
// ============================================================================

/**
 * Type guard that narrows `T | null | undefined` to `T`.
 *
 * @example
 * const items: (string | null)[] = ['a', null, 'b'];
 * const filtered = items.filter(isNonNull); // string[]
 */
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ============================================================================
// JSON helpers
// ============================================================================

/**
 * Safely parse a JSON string, returning a fallback value on failure.
 *
 * @example
 * parseJsonSafe('{"a": 1}', { a: 0 }) // => { a: 1 }
 * parseJsonSafe('invalid', { a: 0 })   // => { a: 0 }
 */
export function parseJsonSafe<T>(str: string, fallback: T): T {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Pretty-print a value as a JSON string with 2-space indentation.
 * Handles circular references gracefully.
 *
 * @example
 * formatJson({ a: 1, b: [2, 3] })
 * // => '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}'
 */
export function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    // Circular reference — use a replacer to handle it
    const seen = new WeakSet();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    }, 2);
  }
}