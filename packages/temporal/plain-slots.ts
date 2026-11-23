import {
  allocateSharedDateTime,
  allocateSharedDay,
  getSharedDateTimeSlot,
  getSharedDaySlot,
  getSharedZonedSlot,
  nativeTemporal,
  type DaySlotKind,
  type NativeDateSnapshot,
  type NativeTimeResult,
} from '#packages/temporal/native.js'
import {zonedKernel} from '#packages/temporal/zones.js'
import type {CalendarDate} from '#packages/temporal/calendar.js'
import {createObject} from '#packages/temporal/intrinsics.js'
export const isoDateFields: unique symbol = Symbol()
export interface DateSlot {
  [isoDateFields]?: Readonly<CalendarDate>
  readonly properties?: NativeDateSnapshot
  readonly epochDay: number
  readonly calendar: string
}
export interface DateTimeSlot {
  readonly epochDay?: number
  readonly properties?: NativeDateSnapshot
  readonly epochNanoseconds: bigint
  readonly calendar: string
}
const dateTimes = new WeakMap<object, DateTimeSlot>()
const times = new WeakMap<object, bigint | NativeTimeResult>()
const ToBigInt = BigInt
const nativeTimeLookup =
  import.meta.formatjsTemporalNativeData === true
    ? times.get.bind(times)
    : undefined!
interface DaySlots {
  get(value: object): DateSlot | undefined
  allocate(prototype: object, slot: DateSlot): object
}

// ECMA-262 preview §§22.11.4, 22.13.4 and 22.14.4: keep per-kind slot brands.
// https://tc39.es/ecma262/pr/3966/#sec-properties-of-temporal-plaindate-instances
// https://tc39.es/ecma262/pr/3966/#sec-properties-of-temporal-plainyearmonth-instances
// https://tc39.es/ecma262/pr/3966/#sec-properties-of-temporal-plainmonthday-instances
function daySlots(kind: DaySlotKind): DaySlots {
  const slots = new WeakMap<object, DateSlot>()
  const getLocal = slots.get.bind(slots)
  const setLocal = slots.set.bind(slots)

  function get(value: object): DateSlot | undefined {
    if (import.meta.formatjsTemporalNativeData === true) return getLocal(value)
    if (nativeTemporal()) {
      const local = getLocal(value)
      if (local) return local
    }
    return getSharedDaySlot(value, kind)
  }

  function allocate(prototype: object, slot: DateSlot): object {
    if (import.meta.formatjsTemporalNativeData === true || nativeTemporal()) {
      const value = createObject(prototype)
      setLocal(value, slot)
      return value
    }
    // Share the prepared fields and their ISO projection across entry points.
    return allocateSharedDay(prototype, kind, slot)
  }
  return {get, allocate}
}

const dates = daySlots('date')
const yearMonths = daySlots('year-month')
const monthDays = daySlots('month-day')

export const getDateSlot: DaySlots['get'] = dates.get
export const allocateDate: DaySlots['allocate'] = dates.allocate
export const getYearMonthSlot: DaySlots['get'] = yearMonths.get
export const allocateYearMonth: DaySlots['allocate'] = yearMonths.allocate
export const getMonthDaySlot: DaySlots['get'] = monthDays.get
export const allocateMonthDay: DaySlots['allocate'] = monthDays.allocate

const getLocalDateTime = dateTimes.get.bind(dateTimes)
const setLocalDateTime = dateTimes.set.bind(dateTimes)
export const setNativeDateTimeSlot: (
  value: object,
  slot: DateTimeSlot
) => unknown =
  import.meta.formatjsTemporalNativeData === true
    ? setLocalDateTime
    : undefined!

// ECMA-262 preview §22.10.4: read initialized date-time slots.
// https://tc39.es/ecma262/pr/3966/#sec-properties-of-temporal-plaindatetime-instances
export function getDateTimeSlot(value: object): DateTimeSlot | undefined {
  if (import.meta.formatjsTemporalNativeData === true)
    return getLocalDateTime(value)
  if (nativeTemporal()) {
    const local = getLocalDateTime(value)
    if (local) return local
  }
  return getSharedDateTimeSlot(value)
}

// ECMA-262 preview §22.10.5.1: initialize date-time slots.
// https://tc39.es/ecma262/pr/3966/#sec-createtemporaldatetime
export function allocateDateTime(
  prototype: object,
  slot: DateTimeSlot
): object {
  if (import.meta.formatjsTemporalNativeData === true || nativeTemporal()) {
    const value = createObject(prototype)
    setLocalDateTime(value, slot)
    return value
  }
  return allocateSharedDateTime(prototype, slot)
}
// Temporal comparison §4.3.3 step 3.
// Decode native time storage for the clock projection.
export const getTimeSlot: (value: object) => bigint | undefined =
  import.meta.formatjsTemporalNativeData === true
    ? value => {
        // Temporal comparison §4.3.3 step 3. Decode the clock slot exactly.
        const slot = nativeTimeLookup(value)
        if (typeof slot === 'bigint' || slot === undefined) return slot
        return (
          slot.bigintNanoseconds ??
          (slot.bigintNanoseconds = ToBigInt(slot.nanoseconds))
        )
      }
    : (times.get.bind(times) as (value: object) => bigint | undefined)
export const getNativeTimeSlot: (
  value: object
) => NativeTimeResult | undefined = nativeTimeLookup as (
  value: object
) => NativeTimeResult | undefined
export const setNativeTimeSlot: (
  value: object,
  slot: NativeTimeResult
) => unknown =
  import.meta.formatjsTemporalNativeData === true
    ? times.set.bind(times)
    : undefined!
export const setTimeSlot: (value: object, slot: bigint) => unknown =
  times.set.bind(times)

export interface ZonedSlot extends DateTimeSlot {
  readonly timeZone: string
}
const zonedDates = new WeakMap<object, ZonedSlot>()
const getLocalZonedSlot = zonedDates.get.bind(zonedDates)
export const getZonedSlot: (value: object) => ZonedSlot | undefined =
  import.meta.formatjsTemporalNativeData === true
    ? getLocalZonedSlot
    : value => getLocalZonedSlot(value) ?? getSharedZonedSlot(value)
export const setZonedSlot: (value: object, slot: ZonedSlot) => unknown =
  zonedDates.set.bind(zonedDates)

// Temporal comparison §5.5.6 step 2.b.i.
// Project a stored ZonedDateTime epoch into its local clock.
export function getZonedDateTimeSlot(value: object): DateTimeSlot | undefined {
  const slot = getZonedSlot(value)
  return (
    slot && {
      epochNanoseconds:
        slot.epochNanoseconds +
        zonedKernel(slot.timeZone).offsetNanoseconds(slot.epochNanoseconds),
      calendar: slot.calendar,
    }
  )
}
