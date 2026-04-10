/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-arraycreate
 */
export function ArrayCreate<T = any>(len: number): T[] {
  return Array.from({length: len})
}
