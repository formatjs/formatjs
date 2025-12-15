import {ToObject} from './262.js'

/**
 * https://tc39.es/ecma402/#sec-coerceoptionstoobject
 * @param options
 * @returns
 */
export function CoerceOptionsToObject<T>(options?: T): T {
  if (typeof options === 'undefined') {
    return Object.create(null)
  }
  return ToObject(options)
}
