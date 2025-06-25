import {Decimal} from 'decimal.js'
import {ZERO} from './constants'
import {invariant} from './utils'
/**
 * https://tc39.es/ecma262/#sec-tostring
 */
export function ToString(o: unknown): string {
  // Only symbol is irregular...
  if (typeof o === 'symbol') {
    throw TypeError('Cannot convert a Symbol value to a string')
  }

  return String(o)
}

/**
 * https://tc39.es/ecma262/#sec-tonumber
 * @param val
 */
export function ToNumber(arg: any): Decimal {
  if (typeof arg === 'number') {
    return new Decimal(arg)
  }
  invariant(
    typeof arg !== 'bigint' && typeof arg !== 'symbol',
    'BigInt and Symbol are not supported',
    TypeError
  )
  if (arg === undefined) {
    return new Decimal(NaN)
  }
  if (arg === null || arg === 0) {
    return ZERO
  }
  if (arg === true) {
    return new Decimal(1)
  }
  if (typeof arg === 'string') {
    try {
      return new Decimal(arg)
    } catch (e) {
      return new Decimal(NaN)
    }
  }
  invariant(typeof arg === 'object', 'object expected', TypeError)
  let primValue = ToPrimitive(arg, 'number')
  invariant(typeof primValue !== 'object', 'object expected', TypeError)
  return ToNumber(primValue)
}

/**
 * https://tc39.es/ecma262/#sec-tointeger
 * @param n
 */
function ToInteger(n: any): Decimal {
  const number = ToNumber(n)
  if (number.isNaN() || number.isZero()) {
    return ZERO
  }
  if (number.isFinite()) {
    return number
  }
  let integer = number.abs().floor()
  if (number.isNegative()) {
    integer = integer.negated()
  }
  return integer
}

/**
 * https://tc39.es/ecma262/#sec-timeclip
 * @param time
 */
export function TimeClip(time: Decimal): Decimal {
  if (!time.isFinite()) {
    return new Decimal(NaN)
  }
  if (time.abs().greaterThan(8.64 * 1e15)) {
    return new Decimal(NaN)
  }
  return ToInteger(time)
}

/**
 * https://tc39.es/ecma262/#sec-toobject
 * @param arg
 */
export function ToObject<T>(
  arg: T
): T extends null ? never : T extends undefined ? never : T {
  if (arg == null) {
    throw new TypeError('undefined/null cannot be converted to object')
  }
  return Object(arg)
}

/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-samevalue
 * @param x
 * @param y
 */
export function SameValue(x: any, y: any): boolean {
  if (Object.is) {
    return Object.is(x, y)
  }
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    return x !== 0 || 1 / x === 1 / y
  }
  // Step 6.a: NaN == NaN
  return x !== x && y !== y
}

/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-arraycreate
 * @param len
 */
export function ArrayCreate<T = any>(len: number): T[] {
  return new Array(len)
}

/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-hasownproperty
 * @param o
 * @param prop
 */
export function HasOwnProperty(o: object, prop: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, prop)
}

/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-type
 * @param x
 */
export function Type(
  x: any
):
  | 'Null'
  | 'Undefined'
  | 'Object'
  | 'Number'
  | 'Boolean'
  | 'String'
  | 'Symbol'
  | 'BigInt'
  | undefined {
  if (x === null) {
    return 'Null'
  }
  if (typeof x === 'undefined') {
    return 'Undefined'
  }
  if (typeof x === 'function' || typeof x === 'object') {
    return 'Object'
  }
  if (typeof x === 'number') {
    return 'Number'
  }
  if (typeof x === 'boolean') {
    return 'Boolean'
  }
  if (typeof x === 'string') {
    return 'String'
  }
  if (typeof x === 'symbol') {
    return 'Symbol'
  }
  if (typeof x === 'bigint') {
    return 'BigInt'
  }
}

const MS_PER_DAY = 86400000

/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#eqn-modulo
 * @param x
 * @param y
 * @return k of the same sign as y
 */
function mod(x: number, y: number): number {
  return x - Math.floor(x / y) * y
}

/**
 * https://tc39.es/ecma262/#eqn-Day
 * @param t
 */
export function Day(t: number): number {
  return Math.floor(t / MS_PER_DAY)
}

/**
 * https://tc39.es/ecma262/#sec-week-day
 * @param t
 */
export function WeekDay(t: number): number {
  return mod(Day(t) + 4, 7)
}

/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param y
 */
export function DayFromYear(y: number): number {
  if (y < 100) {
    // Date.UTC parses 0 - 99 as 1900 - 1999
    const date = new Date(0);
    date.setUTCFullYear(y, 0, 1);
    date.setUTCHours(0, 0, 0, 0);
    return date.getTime() / MS_PER_DAY;
  }
  return Date.UTC(y, 0) / MS_PER_DAY
}

/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param y
 */
export function TimeFromYear(y: number): number {
  return Date.UTC(y, 0)
}

/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param t
 */
export function YearFromTime(t: number): number {
  return new Date(t).getUTCFullYear()
}

export function DaysInYear(y: number): 365 | 366 {
  if (y % 4 !== 0) {
    return 365
  }
  if (y % 100 !== 0) {
    return 366
  }
  if (y % 400 !== 0) {
    return 365
  }
  return 366
}

export function DayWithinYear(t: number): number {
  return Day(t) - DayFromYear(YearFromTime(t))
}

export function InLeapYear(t: number): 0 | 1 {
  return DaysInYear(YearFromTime(t)) === 365 ? 0 : 1
}

/**
 * https://tc39.es/ecma262/#sec-month-number
 * @param t
 */
export function MonthFromTime(
  t: number
): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 {
  const dwy = DayWithinYear(t)
  const leap = InLeapYear(t)
  if (dwy >= 0 && dwy < 31) {
    return 0
  }
  if (dwy < 59 + leap) {
    return 1
  }
  if (dwy < 90 + leap) {
    return 2
  }
  if (dwy < 120 + leap) {
    return 3
  }
  if (dwy < 151 + leap) {
    return 4
  }
  if (dwy < 181 + leap) {
    return 5
  }
  if (dwy < 212 + leap) {
    return 6
  }
  if (dwy < 243 + leap) {
    return 7
  }
  if (dwy < 273 + leap) {
    return 8
  }
  if (dwy < 304 + leap) {
    return 9
  }
  if (dwy < 334 + leap) {
    return 10
  }
  if (dwy < 365 + leap) {
    return 11
  }
  throw new Error('Invalid time')
}

export function DateFromTime(t: number): number {
  const dwy = DayWithinYear(t)
  const mft = MonthFromTime(t)
  const leap = InLeapYear(t)
  if (mft === 0) {
    return dwy + 1
  }
  if (mft === 1) {
    return dwy - 30
  }
  if (mft === 2) {
    return dwy - 58 - leap
  }
  if (mft === 3) {
    return dwy - 89 - leap
  }
  if (mft === 4) {
    return dwy - 119 - leap
  }
  if (mft === 5) {
    return dwy - 150 - leap
  }
  if (mft === 6) {
    return dwy - 180 - leap
  }
  if (mft === 7) {
    return dwy - 211 - leap
  }
  if (mft === 8) {
    return dwy - 242 - leap
  }
  if (mft === 9) {
    return dwy - 272 - leap
  }
  if (mft === 10) {
    return dwy - 303 - leap
  }
  if (mft === 11) {
    return dwy - 333 - leap
  }
  throw new Error('Invalid time')
}

const HOURS_PER_DAY = 24
const MINUTES_PER_HOUR = 60
const SECONDS_PER_MINUTE = 60
const MS_PER_SECOND = 1e3
const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE
const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR

export function HourFromTime(t: number): number {
  return mod(Math.floor(t / MS_PER_HOUR), HOURS_PER_DAY)
}

export function MinFromTime(t: number): number {
  return mod(Math.floor(t / MS_PER_MINUTE), MINUTES_PER_HOUR)
}

export function SecFromTime(t: number): number {
  return mod(Math.floor(t / MS_PER_SECOND), SECONDS_PER_MINUTE)
}

function IsCallable(fn: any): fn is Function {
  return typeof fn === 'function'
}

/**
 * The abstract operation OrdinaryHasInstance implements
 * the default algorithm for determining if an object O
 * inherits from the instance object inheritance path
 * provided by constructor C.
 * @param C class
 * @param O object
 * @param internalSlots internalSlots
 */
export function OrdinaryHasInstance(
  C: Object,
  O: any,
  internalSlots?: {boundTargetFunction: any}
): boolean {
  if (!IsCallable(C)) {
    return false
  }
  if (internalSlots?.boundTargetFunction) {
    let BC = internalSlots?.boundTargetFunction
    return O instanceof BC
  }
  if (typeof O !== 'object') {
    return false
  }
  let P = C.prototype
  if (typeof P !== 'object') {
    throw new TypeError(
      'OrdinaryHasInstance called on an object with an invalid prototype property.'
    )
  }
  return Object.prototype.isPrototypeOf.call(P, O)
}

export function msFromTime(t: number): number {
  return mod(t, MS_PER_SECOND)
}

function OrdinaryToPrimitive<
  T extends 'string' | 'number' = 'string' | 'number',
>(O: object, hint: T): string | number | boolean | undefined | null {
  let methodNames: Array<'toString' | 'valueOf'>
  if (hint === 'string') {
    methodNames = ['toString', 'valueOf']
  } else {
    methodNames = ['valueOf', 'toString']
  }
  for (const name of methodNames) {
    const method = O[name]
    if (IsCallable(method)) {
      let result = method.call(O)
      if (typeof result !== 'object') {
        return result
      }
    }
  }
  throw new TypeError('Cannot convert object to primitive value')
}

export function ToPrimitive<
  T extends 'string' | 'number' = 'string' | 'number',
>(input: any, preferredType: T): string | number | boolean | undefined | null {
  if (typeof input === 'object' && input != null) {
    const exoticToPrim =
      Symbol.toPrimitive in input ? input[Symbol.toPrimitive] : undefined
    let hint
    if (exoticToPrim !== undefined) {
      if (preferredType === undefined) {
        hint = 'default'
      } else if (preferredType === 'string') {
        hint = 'string'
      } else {
        invariant(
          preferredType === 'number',
          'preferredType must be "string" or "number"'
        )
        hint = 'number'
      }
      let result = exoticToPrim.call(input, hint)
      if (typeof result !== 'object') {
        return result
      }
      throw new TypeError('Cannot convert exotic object to primitive.')
    }
    if (preferredType === undefined) {
      preferredType = 'number' as T
    }
    return OrdinaryToPrimitive(input, preferredType)
  }
  return input
}
