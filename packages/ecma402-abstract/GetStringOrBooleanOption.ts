/**
 * https://tc39.es/ecma402/#sec-getstringorbooleanoption
 * @param opts
 * @param prop
 * @param values
 * @param trueValue
 * @param falsyValue
 * @param fallback
 */

import {ToString} from './262'

export function GetStringOrBooleanOption<T extends object, K extends keyof T>(
  opts: T,
  prop: K,
  values: T[K][] | undefined,
  trueValue: T[K] | boolean,
  falsyValue: T[K] | boolean,
  fallback: T[K] | boolean
): T[K] | boolean {
  let value: any = opts[prop]
  if (value === undefined) {
    return fallback
  }
  if (value === true) {
    return trueValue
  }
  const valueBoolean = Boolean(value)

  if (valueBoolean === false) {
    return falsyValue
  }

  value = ToString(value)

  if (value === 'true' || value === 'false') {
    return fallback
  }

  if ((values || []).indexOf(value) === -1) {
    throw new RangeError(`Invalid value ${value}`)
  }

  return value
}
