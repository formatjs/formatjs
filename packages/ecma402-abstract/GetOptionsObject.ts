import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'

const createObject = Object.create

/**
 * ECMA-262 §7.3.36 GetOptionsObject, steps 1–3.
 * https://tc39.es/ecma262/#sec-getoptionsobject
 * @param options
 * @returns
 */
export function GetOptionsObject<T extends object>(options?: T): T {
  if (options === undefined) {
    return createObject(null)
  }
  if (IsObject(options)) {
    return options
  }
  throw new TypeErrorConstructor('Options must be an object')
}
