/** ECMA-262 §7.2.9, including Number::sameValue. */
export function SameValue(x: any, y: any): boolean {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y
  }
  return x !== x && y !== y
}
