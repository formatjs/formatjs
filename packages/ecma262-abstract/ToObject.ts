/**
 * https://tc39.es/ecma262/#sec-toobject
 */
export function ToObject<T>(
  arg: T
): T extends null ? never : T extends undefined ? never : T {
  if (arg == null) {
    throw new TypeError('undefined/null cannot be converted to object')
  }
  return Object(arg)
}
