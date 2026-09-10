import {ToString} from '#packages/ecma262-abstract/ToString.js'

/**
 * https://tc39.es/ecma402/#sec-getoption
 * @param opts
 * @param prop
 * @param type
 * @param values
 * @param fallback
 */
export function GetOption<T extends object, K extends keyof T, F>(
  opts: T,
  prop: K,
  type: 'string' | 'boolean',
  values: readonly T[K][] | undefined,
  fallback: F
): Exclude<T[K], undefined> | F {
  // ECMA-402 §9.2.11 GetOption, step 1: Get accepts callable Objects too.
  // https://tc39.es/ecma402/#sec-getoption
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L384
  if (
    opts === null ||
    (typeof opts !== 'object' && typeof opts !== 'function')
  ) {
    throw new TypeError('Options must be an object')
  }
  let value: any = opts[prop]
  if (value !== undefined) {
    if (type !== 'boolean' && type !== 'string') {
      throw new TypeError('invalid type')
    }
    if (type === 'boolean') {
      value = Boolean(value)
    }
    if (type === 'string') {
      value = ToString(value)
    }
    if (values !== undefined && !values.filter(val => val == value).length) {
      throw new RangeError(`${value} is not within ${values.join(', ')}`)
    }
    return value
  }
  return fallback
}
