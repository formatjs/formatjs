import {ToString} from './262.js'

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
  if (typeof opts !== 'object') {
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
