/**
 * https://tc39.es/ecma262/#sec-tostring
 */
export function ToString(o: unknown): string {
  if (typeof o === 'symbol') {
    throw TypeError('Cannot convert a Symbol value to a string')
  }
  return String(o)
}
