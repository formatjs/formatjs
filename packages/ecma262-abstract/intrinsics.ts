// Specification arithmetic must not consult a replacement installed by user code.
export const floor: typeof Math.floor = Math.floor

// Number/BigInt calls retain constructor conversion semantics.
export const numberFrom: typeof Number = Number
export const bigIntFrom: typeof BigInt = BigInt
export const objectFrom: typeof Object = Object

// A derived class can allocate its receiver without the base-class prototype read.
export const nullClassBase: abstract new () => object = null as never

export const objectCreate: typeof Object.create = Object.create

// ECMA-262 §10.1.13–14 use the requested prototype or the intrinsic fallback.
// This fallback is limited to the polyfill's own realm.
// https://tc39.es/ecma262/#sec-getprototypefromconstructor
export function createFromConstructor<T extends object>(
  newTarget: {prototype: unknown},
  defaultPrototype: T
): T {
  const prototype = newTarget.prototype
  return objectCreate(
    objectFrom(prototype) === prototype
      ? (prototype as object)
      : defaultPrototype
  )
}

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

const includes = Array.prototype.includes
const indexOf = Array.prototype.indexOf

export function arrayIncludes(
  values: readonly unknown[],
  search: unknown
): boolean {
  return arrayApply(includes, values, [search])
}

export function arrayIndexOf(
  values: readonly unknown[],
  search: unknown
): number {
  return arrayApply(indexOf, values, [search])
}

const defineProperty = Object.defineProperty

// Private Record fields must not invoke inherited setters or descriptor getters.
export function setDataProperty(
  target: object,
  key: PropertyKey,
  value: unknown
): void {
  const descriptor = {
    __proto__: null,
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  }
  defineProperty(target, key, descriptor)
}
