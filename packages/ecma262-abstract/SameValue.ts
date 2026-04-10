/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-samevalue
 */
export function SameValue(x: any, y: any): boolean {
  if (Object.is) {
    return Object.is(x, y)
  }
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y
  }
  return x !== x && y !== y
}
