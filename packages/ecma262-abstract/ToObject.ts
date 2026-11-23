import {
  TypeErrorConstructor,
  objectFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
/**
 * https://tc39.es/ecma262/#sec-toobject
 */
export function ToObject<T>(
  arg: T
): T extends null ? never : T extends undefined ? never : T {
  if (arg === undefined || arg === null) {
    throw new TypeErrorConstructor(
      'undefined/null cannot be converted to object'
    )
  }
  return objectFrom(arg)
}
