import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  arraySome,
} from '#packages/ecma262-abstract/intrinsics.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'

const optionApply = Reflect.apply
const optionJoin = Array.prototype.join

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
  // ECMA-402 §9.2.11 GetOption, step 1: Get accepts host and callable Objects too.
  // https://tc39.es/ecma402/#sec-getoption
  if (!IsObject(opts)) {
    throw new TypeErrorConstructor('Options must be an object')
  }
  let value: any = opts[prop]
  if (value !== undefined) {
    if (type !== 'boolean' && type !== 'string') {
      throw new TypeErrorConstructor('invalid type')
    }
    if (type === 'boolean') {
      // ECMA-402 §9.2.11 step 3.a uses intrinsic ToBoolean.
      // https://tc39.es/ecma262/#sec-toboolean
      value = !!value
    }
    if (type === 'string') {
      value = ToString(value)
    }
    if (values?.length && !arraySome(values, val => val === value)) {
      throw new RangeErrorConstructor(
        `${value} is not within ${optionApply(optionJoin, values, [', '])}`
      )
    }
    return value
  }
  return fallback
}
