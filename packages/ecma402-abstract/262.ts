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
export function ToNumber(val: any): number {
  if (val === undefined) {
    return NaN
  }
  if (val === null) {
    return +0
  }
  if (typeof val === 'boolean') {
    return val ? 1 : +0
  }
  if (typeof val === 'number') {
    return val
  }
  if (typeof val === 'symbol' || typeof val === 'bigint') {
    throw new TypeError('Cannot convert symbol/bigint to number')
  }
  return Number(val)
}

/**
 * https://tc39.es/ecma262/#sec-tointeger
 * @param n
 */
function ToInteger(n: any) {
  const number = ToNumber(n)
  if (isNaN(number) || SameValue(number, -0)) {
    return 0
  }
  if (isFinite(number)) {
    return number
  }
  let integer = Math.floor(Math.abs(number))
  if (number < 0) {
    integer = -integer
  }
  if (SameValue(integer, -0)) {
    return 0
  }
  return integer
}

/**
 * https://tc39.es/ecma262/#sec-timeclip
 * @param time
 */
export function TimeClip(time: number) {
  if (!isFinite(time)) {
    return NaN
  }
  if (Math.abs(time) > 8.64 * 1e15) {
    return NaN
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
export function SameValue(x: any, y: any) {
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
export function ArrayCreate(len: number) {
  return new Array(len)
}

/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-hasownproperty
 * @param o
 * @param prop
 */
export function HasOwnProperty(o: object, prop: string) {
  return Object.prototype.hasOwnProperty.call(o, prop)
}

/**
 * https://www.ecma-international.org/ecma-262/11.0/index.html#sec-type
 * @param x
 */
export function Type(x: any) {
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
export function Day(t: number) {
  return Math.floor(t / MS_PER_DAY)
}

/**
 * https://tc39.es/ecma262/#sec-week-day
 * @param t
 */
export function WeekDay(t: number) {
  return mod(Day(t) + 4, 7)
}

/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param y
 */
export function DayFromYear(y: number) {
  return Date.UTC(y, 0) / MS_PER_DAY
}

/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param y
 */
export function TimeFromYear(y: number) {
  return Date.UTC(y, 0)
}

/**
 * https://tc39.es/ecma262/#sec-year-number
 * @param t
 */
export function YearFromTime(t: number) {
  return new Date(t).getUTCFullYear()
}

export function DaysInYear(y: number) {
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

export function DayWithinYear(t: number) {
  return Day(t) - DayFromYear(YearFromTime(t))
}

export function InLeapYear(t: number): 0 | 1 {
  return DaysInYear(YearFromTime(t)) === 365 ? 0 : 1
}

/**
 * https://tc39.es/ecma262/#sec-month-number
 * @param t
 */
export function MonthFromTime(t: number) {
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

export function DateFromTime(t: number) {
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

export function HourFromTime(t: number) {
  return mod(Math.floor(t / MS_PER_HOUR), HOURS_PER_DAY)
}

export function MinFromTime(t: number) {
  return mod(Math.floor(t / MS_PER_MINUTE), MINUTES_PER_HOUR)
}

export function SecFromTime(t: number) {
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
) {
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
