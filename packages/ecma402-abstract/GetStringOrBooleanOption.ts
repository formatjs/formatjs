import {
  RangeErrorConstructor,
  arrayIndexOf,
} from '#packages/ecma262-abstract/intrinsics.js'
/**
 * ECMA-402 §9.2.12 reads and coerces the grouping option.
 * The caller supplies the legacy conversions from §16.1.1 steps 22–23.
 * https://tc39.es/ecma402/#sec-getbooleanorstringnumberformatoption
 * @param opts
 * @param prop
 * @param values
 * @param trueValue
 * @param falsyValue
 * @param fallback
 */

import {ToString} from '#packages/ecma262-abstract/ToString.js'

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
  // ECMA-402 §9.2.12 step 4 uses intrinsic ToBoolean.
  // https://tc39.es/ecma262/#sec-toboolean
  if (!value) {
    return falsyValue
  }

  value = ToString(value)

  if (value === 'true' || value === 'false') {
    return fallback
  }

  if (arrayIndexOf(values || [], value) === -1) {
    throw new RangeErrorConstructor(`Invalid value ${value}`)
  }

  return value
}
