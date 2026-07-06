/**
 * BABIRYE v10.0.0 — Array Manipulation Utilities
 *
 * Pure, type-safe utility functions for common array transformations
 * that are not provided by vanilla JavaScript.
 */

// ============================================================================
// Grouping
// ============================================================================

/**
 * Group array items by a key into a record of arrays.
 *
 * @example
 * groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}, {type: 'a', val: 3}], 'type')
 * // => { a: [{type: 'a', val: 1}, {type: 'a', val: 3}], b: [{type: 'b', val: 2}] }
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Sort an array by a key in ascending or descending order.
 * Returns a new array (does not mutate the original).
 * Uses `localeCompare` for string values and native `<` / `>` for numbers.
 *
 * @example
 * sortBy([{name: 'Charlie'}, {name: 'Alice'}], 'name')
 * // => [{name: 'Alice'}, {name: 'Charlie'}]
 */
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  const sorted = [...array];
  sorted.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    if (typeof valA === 'string' && typeof valB === 'string') {
      const cmp = valA.localeCompare(valB);
      return direction === 'desc' ? -cmp : cmp;
    }

    if (valA == null && valB == null) return 0;
    if (valA == null) return direction === 'desc' ? 1 : -1;
    if (valB == null) return direction === 'desc' ? -1 : 1;

    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return direction === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

// ============================================================================
// Uniqueness
// ============================================================================

/**
 * Return a new array with duplicate items removed, based on a key.
 * Keeps the first occurrence of each unique key value.
 *
 * @example
 * uniqueBy([{id: 1, name: 'a'}, {id: 2, name: 'b'}, {id: 1, name: 'c'}], 'id')
 * // => [{id: 1, name: 'a'}, {id: 2, name: 'b'}]
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// ============================================================================
// Chunking
// ============================================================================

/**
 * Split an array into chunks of the specified size.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2)
 * // => [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size < 1) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// ============================================================================
// Flattening
// ============================================================================

/**
 * Flatten an array of arrays into a single array.
 * One level deep (like `Array.prototype.flat()` with depth 1).
 *
 * @example
 * flatten([[1, 2], [3, 4], [5]]) // => [1, 2, 3, 4, 5]
 */
export function flatten<T>(arrays: T[][]): T[] {
  return arrays.flat();
}

// ============================================================================
// Randomisation
// ============================================================================

/**
 * Return a new array with items in random order (Fisher-Yates shuffle).
 * Does not mutate the original array.
 *
 * @example
 * shuffle([1, 2, 3, 4, 5]) // => [3, 1, 5, 2, 4] (random)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// Counting & Filtering
// ============================================================================

/**
 * Count the number of items in an array that satisfy a predicate.
 *
 * @example
 * countBy([{active: true}, {active: false}, {active: true}], item => item.active)
 * // => 2
 */
export function countBy<T>(array: T[], predicate: (item: T) => boolean): number {
  let count = 0;
  for (const item of array) {
    if (predicate(item)) count++;
  }
  return count;
}

/**
 * Partition an array into two groups based on a predicate.
 * Returns `[truthyItems, falsyItems]`.
 *
 * @example
 * partition([1, 2, 3, 4, 5], n => n % 2 === 0)
 * // => [[2, 4], [1, 3, 5]]
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  return [truthy, falsy];
}

// ============================================================================
// Take while
// ============================================================================

/**
 * Return items from the start of the array while the predicate is true.
 * Stops at the first item that fails the predicate (like Lodash's `takeWhile`).
 *
 * @example
 * takeWhile([1, 2, 3, 4, 1, 2], n => n < 3)
 * // => [1, 2]
 */
export function takeWhile<T>(array: T[], predicate: (item: T) => boolean): T[] {
  const result: T[] = [];
  for (const item of array) {
    if (predicate(item)) {
      result.push(item);
    } else {
      break;
    }
  }
  return result;
}

// ============================================================================
// Find by key-value
// ============================================================================

/**
 * Find the index of the first item where a given key matches a value.
 *
 * @example
 * findIndexBy([{id: 'a', name: 'X'}, {id: 'b', name: 'Y'}], 'id', 'b')
 * // => 1
 */
export function findIndexBy<T>(array: T[], key: keyof T, value: unknown): number {
  return array.findIndex((item) => item[key] === value);
}