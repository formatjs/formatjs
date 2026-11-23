const StringConstructor = String
const TypeErrorConstructor = TypeError

/**
 * https://tc39.es/ecma262/#sec-tostring
 */
export function ToString(o: unknown): string {
  if (typeof o === 'symbol') {
    throw TypeErrorConstructor('Cannot convert a Symbol value to a string')
  }
  return StringConstructor(o)
}
