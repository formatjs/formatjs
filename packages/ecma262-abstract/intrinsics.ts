// Specification arithmetic must not consult a replacement installed by user code.
export const floor: typeof Math.floor = Math.floor

// Number/BigInt calls retain constructor conversion semantics.
export const numberFrom: typeof Number = Number
export const bigIntFrom: typeof BigInt = BigInt
export const mathAbs: typeof Math.abs = Math.abs
export const mathMin: typeof Math.min = Math.min
export const mathMax: typeof Math.max = Math.max
export const mathTrunc: typeof Math.trunc = Math.trunc
export const mathSign: typeof Math.sign = Math.sign
export const numberIsInteger: typeof Number.isInteger = Number.isInteger
export const numberIsFinite: typeof Number.isFinite = Number.isFinite
export const numberIsSafeInteger: typeof Number.isSafeInteger =
  Number.isSafeInteger

// Specification exceptions use the original constructors of this realm.
export const ErrorConstructor: typeof Error = Error
export const TypeErrorConstructor: typeof TypeError = TypeError
export const RangeErrorConstructor: typeof RangeError = RangeError

const arrayApply = Reflect.apply
const every = Array.prototype.every
const some = Array.prototype.some

// Specification Lists do not consult mutable Array.prototype methods.
export function arrayEvery<T>(
  values: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => unknown
): boolean {
  return arrayApply(every, values, [predicate])
}

export function arraySome<T>(
  values: readonly T[],
  predicate: (value: T, index: number, array: readonly T[]) => unknown
): boolean {
  return arrayApply(some, values, [predicate])
}
