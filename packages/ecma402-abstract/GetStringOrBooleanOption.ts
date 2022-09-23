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
  trueValue: T[K],
  falsyValue: T[K],
  fallback: T[K]
): T[K] {
  let value: any = opts[prop]
  if (value === undefined) {
    return fallback
  }
  if (value === true) {
    return trueValue
  }
  let valueBoolean = Boolean(value)

  if (valueBoolean === false) {
    return falsyValue
  }

  value = ToString(value)

  if (value === 'true' || value === 'false') {
    return fallback
  }

  if (!(value in (values || []))) {
    throw new RangeError(`Invalid value ${value}`)
  }

  return value
}
