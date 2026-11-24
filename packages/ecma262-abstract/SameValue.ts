// ECMA-262 §7.2.9 steps 1–3 distinguish signed zero and equate NaN values.
// https://tc39.es/ecma262/#sec-samevalue
export function SameValue(x: any, y: any): boolean {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y
  }
  return x !== x && y !== y
}
