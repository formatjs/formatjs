import {ToObject} from '#packages/ecma262-abstract/ToObject.js'

const createObject = Object.create

/**
 * https://tc39.es/ecma402/#sec-coerceoptionstoobject
 * @param options
 * @returns
 */
export function CoerceOptionsToObject<T>(options?: T): T {
  if (options === undefined) {
    // ECMA-402 §9.2.10 step 1.a creates a private null-prototype object.
    return createObject(null)
  }
  return ToObject(options)
}
