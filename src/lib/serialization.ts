// ============================================================================
// BABIRYE - Advanced Serialization / Deserialization Utilities
// Version: 10.0.0 | Edition: Titanium Ultra + VIP Protection
// ============================================================================

// ============================================================================
// Typed JSON
// ============================================================================

/**
 * Typed JSON parser that wraps `JSON.parse` with a generic type parameter.
 * Provides compile-time type safety; runtime validation is the caller's responsibility.
 *
 * @typeParam T - Expected output type
 * @param json - JSON string to parse
 * @returns Parsed value cast to T
 * @throws {SyntaxError} If the JSON string is malformed
 *
 * @example
 * ```ts
 * const user = TypedJSON.parse<UserProfile>('{"name": "Alice", "role": "admin"}');
 * ```
 */
export const TypedJSON = {
  /**
   * Parse a JSON string with a generic return type.
   */
  parse<T>(json: string): T {
    return JSON.parse(json) as T;
  },

  /**
   * Stringify a value with optional pretty-printing and custom replacer.
   *
   * @param data - Value to serialize
   * @param pretty - If true, use 2-space indentation (default: false)
   * @param replacer - Optional JSON.stringify replacer function
   */
  stringify<T>(data: T, pretty = false, replacer?: (key: string, value: unknown) => unknown): string {
    return JSON.stringify(data, replacer as (this: unknown, key: string, value: unknown) => unknown, pretty ? 2 : undefined);
  },
} as const;

// ============================================================================
// Safe JSON Parsing
// ============================================================================

/**
 * Attempt to parse JSON, returning a fallback value on failure.
 * Never throws — useful for parsing untrusted input.
 *
 * @typeParam T - Expected type of the parsed result
 * @param json - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed value or fallback
 *
 * @example
 * ```ts
 * const config = safeJsonParse<AppConfig>(rawInput, defaultConfig);
 * ```
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Parse JSON and return both the data and potential error.
 * Never throws — useful for form validation and error reporting.
 *
 * @typeParam T - Expected type
 * @param json - JSON string to parse
 * @returns Object with `data` (null on failure) and `error` (null on success)
 */
export function tryParseJson<T>(json: string): { data: T | null; error: string | null } {
  try {
    return { data: JSON.parse(json) as T, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown JSON parse error';
    return { data: null, error: message };
  }
}

/**
 * Check if a string is valid JSON without parsing it.
 *
 * @param str - String to check
 * @returns True if the string can be parsed as JSON
 */
export function isJsonString(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// ============================================================================
// Deep / Recursive JSON Parsing
// ============================================================================

/**
 * Recursively parse JSON strings found within nested objects/arrays.
 * Useful for double-encoded JSON (e.g., API responses that JSON-encode their payloads).
 *
 * @param str - String that may contain nested JSON
 * @param maxDepth - Maximum recursion depth to prevent infinite loops (default: 5)
 * @returns Fully parsed value
 *
 * @example
 * ```ts
 * deepParseJson('"{\\"name\\": \\"Alice\\"}"'); // => { name: "Alice" }
 * ```
 */
export function deepParseJson(str: string, maxDepth = 5): unknown {
  let current: unknown = str;
  for (let i = 0; i < maxDepth; i++) {
    if (typeof current !== 'string') break;
    try {
      const parsed = JSON.parse(current);
      // If parsing returns the same string, stop to avoid infinite loops
      if (typeof parsed === 'string' && parsed === current) break;
      current = parsed;
    } catch {
      break;
    }
  }
  return current;
}

// ============================================================================
// FormData Conversion
// ============================================================================

/**
 * Convert a JSON-compatible object to FormData for multipart/form-data API requests.
 * Handles nested objects by flattening with bracket notation (e.g., `user[name]`).
 * Arrays are expanded with index notation (e.g., `tags[0]`, `tags[1]`).
 * File and Blob values are passed through as-is.
 *
 * @param data - Object to convert
 * @returns FormData instance ready for fetch
 *
 * @example
 * ```ts
 * const fd = jsonToFormData({ name: 'Alice', tags: ['a', 'b'], file: blob });
 * await fetch('/api/upload', { method: 'POST', body: fd });
 * ```
 */
export function jsonToFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();

  const append = (key: string, value: unknown): void => {
    if (value === null || value === undefined) return;
    if (value instanceof Blob || value instanceof File) {
      formData.append(key, value as Blob | File);
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => append(`${key}[${idx}]`, item));
    } else if (typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) =>
        append(`${key}[${k}]`, v)
      );
    } else {
      formData.append(key, String(value));
    }
  };

  for (const [key, value] of Object.entries(data)) {
    append(key, value);
  }

  return formData;
}

/**
 * Convert a FormData object back to a plain JavaScript object.
 * Handles bracket notation keys (e.g., `user[name]`) by reconstructing nested objects.
 * File/Blob entries are included as-is.
 *
 * @param formData - FormData instance to convert
 * @returns Plain object representation of the FormData
 */
export function formDataToJson(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    // Check for bracket notation
    const bracketMatch = key.match(/^([^\[]+)\[(.+)\]$/);
    if (bracketMatch) {
      const [, parentKey, childKey] = bracketMatch;
      if (!result[parentKey] || typeof result[parentKey] !== 'object') {
        result[parentKey] = {};
      }
      (result[parentKey] as Record<string, unknown>)[childKey] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ============================================================================
// JSON Compaction
// ============================================================================

/**
 * Compact a JSON string by parsing and re-stringifying without whitespace.
 * Also validates the JSON in the process.
 *
 * @param obj - Any JSON-serializable value (or a JSON string)
 * @returns Compacted JSON string with no extra whitespace
 * @throws {SyntaxError} If the input is a string that is not valid JSON
 */
export function compactJson(obj: unknown): string {
  if (typeof obj === 'string') {
    return JSON.stringify(JSON.parse(obj));
  }
  return JSON.stringify(obj);
}

// ============================================================================
// Buffer Conversion
// ============================================================================

/**
 * Parse an ArrayBuffer (or Uint8Array) as a UTF-8 JSON string, then parse to object.
 * Useful for handling binary API responses that contain JSON data.
 *
 * @param buffer - ArrayBuffer or Uint8Array containing UTF-8 encoded JSON
 * @returns Parsed JavaScript object
 *
 * @example
 * ```ts
 * const response = await fetch('/api/data');
 * const buffer = await response.arrayBuffer();
 * const data = parseJsonBuffer(buffer);
 * ```
 */
export function parseJsonBuffer(buffer: ArrayBuffer): unknown {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(buffer);
  return JSON.parse(text);
}

/**
 * Convert any value to an ArrayBuffer via JSON serialization + UTF-8 encoding.
 * The inverse of `parseJsonBuffer`.
 *
 * @param data - Any JSON-serializable value
 * @returns ArrayBuffer containing UTF-8 encoded JSON
 */
export function toBuffer(data: unknown): ArrayBuffer {
  const json = JSON.stringify(data);
  const encoder = new TextEncoder();
  return encoder.encode(json).buffer as ArrayBuffer;
}

// ============================================================================
// ANSI Color Stripping
// ============================================================================

/**
 * Remove ANSI escape codes (colors, cursor movements, etc.) from a string.
 * Useful for cleaning log output or terminal-captured text.
 *
 * @param str - String potentially containing ANSI escape codes
 * @returns Cleaned string without ANSI codes
 *
 * @example
 * ```ts
 * stripAnsiColors('\x1b[31mError:\x1b[0m Something went wrong');
 * // => "Error: Something went wrong"
 * ```
 */
export function stripAnsiColors(str: string): string {
  // Matches CSI sequences (ESC [ ... m/letter), OSC sequences, and other common ANSI patterns
  const ansiRegex = /[\x1b\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return str.replace(ansiRegex, '');
}