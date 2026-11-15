// Experimental Instant slice. Limited strings; no durations or cross-realm slots.
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'
import {parseInstantString} from './instant-string.js'

export interface InstantObject {
  readonly epochNanoseconds: bigint
  readonly epochMilliseconds: number
  equals(other: unknown): boolean
  valueOf(): never
}
export interface InstantConstructor {
  new (epochNanoseconds: unknown): InstantObject
  readonly prototype: InstantObject
  from(item: unknown): InstantObject
  fromEpochNanoseconds(epochNanoseconds: unknown): InstantObject
  fromEpochMilliseconds(epochMilliseconds: unknown): InstantObject
}
const slots = new WeakMap<object, bigint>()
const getSlot = slots.get.bind(slots)
const setSlot = slots.set.bind(slots)
const limit = 8_640_000_000_000_000_000_000n
function validate(value: bigint): bigint {
  if (value < -limit || value > limit)
    throw new RangeError('Instant out of range')
  return value
}
function toBigInt(value: unknown): bigint {
  const primitive = ToPrimitive(value, 'number')
  if (
    typeof primitive !== 'bigint' &&
    typeof primitive !== 'string' &&
    typeof primitive !== 'boolean'
  )
    throw new TypeError('Invalid BigInt input')
  return BigInt(primitive)
}
function read(value: unknown): bigint {
  const result = getSlot(value as object)
  if (result === undefined) throw new TypeError('Invalid Instant receiver')
  return result
}
function create(value: bigint): InstantObject {
  const result = Object.create(InstantValue.prototype) as InstantObject
  setSlot(result, validate(value))
  return result
}
function toInstant(item: unknown): bigint {
  const existing = getSlot(item as object)
  if (existing !== undefined) return existing
  const primitive = ToPrimitive(item, 'string')
  if (typeof primitive !== 'string')
    throw new TypeError('Expected Instant or instant string')
  return validate(parseInstantString(primitive))
}
class InstantValue implements InstantObject {
  constructor(_epochNanoseconds: unknown) {
    throw new TypeError('Use the exported Instant constructor')
  }
  static from(item: unknown): InstantObject {
    return create(toInstant(item))
  }
  static fromEpochNanoseconds(epochNanoseconds: unknown): InstantObject {
    return create(toBigInt(epochNanoseconds))
  }
  static fromEpochMilliseconds(epochMilliseconds: unknown): InstantObject {
    // Unary + is ToNumber; unlike BigInt(), it rejects BigInt/Symbol input.
    const milliseconds = +(epochMilliseconds as number)
    return create(BigInt(milliseconds) * 1_000_000n)
  }
  get epochNanoseconds(): bigint {
    return read(this)
  }
  get epochMilliseconds(): number {
    const value = read(this)
    const truncated = value / 1_000_000n
    return Number(
      value < 0n && value % 1_000_000n !== 0n ? truncated - 1n : truncated
    )
  }
  equals(other: unknown): boolean {
    return read(this) === toInstant(other)
  }
  valueOf(): never {
    throw new TypeError('Cannot convert Temporal.Instant to primitive')
  }
}
Object.defineProperty(InstantValue, 'name', {
  value: 'Instant',
  configurable: true,
})
// A normal JS constructor allocates before its body; Temporal coerces first.
export const Instant: InstantConstructor = new Proxy(InstantValue, {
  construct(target, args, newTarget) {
    const value = validate(toBigInt(args[0]))
    const prototype = Reflect.get(newTarget, 'prototype')
    const result = Object.create(
      prototype !== null &&
        (typeof prototype === 'object' || typeof prototype === 'function')
        ? prototype
        : target.prototype
    )
    setSlot(result, value)
    return result
  },
})
Object.defineProperties(InstantValue.prototype, {
  constructor: {value: Instant, writable: true, configurable: true},
  [Symbol.toStringTag]: {value: 'Temporal.Instant', configurable: true},
})
export const Temporal: {Instant: InstantConstructor} = Object.defineProperties(
  {},
  {
    Instant: {value: Instant, writable: true, configurable: true},
    [Symbol.toStringTag]: {value: 'Temporal', configurable: true},
  }
) as {Instant: InstantConstructor}
