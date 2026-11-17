import type {
  NativeDateSnapshot,
  NativeTimeResult,
} from '#packages/temporal/native.js'
import {zonedKernel} from '#packages/temporal/zones.js'
export interface DateSlot {
  readonly properties?: NativeDateSnapshot
  readonly epochDay: number
  readonly calendar: string
}
export interface DateTimeSlot {
  readonly properties?: NativeDateSnapshot
  readonly epochNanoseconds: bigint
  readonly calendar: string
}
const dates = new WeakMap<object, DateSlot>()
const dateTimes = new WeakMap<object, DateTimeSlot>()
const times = new WeakMap<object, bigint | NativeTimeResult>()
const ToBigInt = BigInt
const nativeTimeLookup =
  import.meta.formatjsTemporalNativeData === true
    ? times.get.bind(times)
    : undefined!
export const getDateSlot: (value: object) => DateSlot | undefined =
  dates.get.bind(dates)
export const setDateSlot: (value: object, slot: DateSlot) => unknown =
  dates.set.bind(dates)
export const getDateTimeSlot: (value: object) => DateTimeSlot | undefined =
  dateTimes.get.bind(dateTimes)
export const setDateTimeSlot: (value: object, slot: DateTimeSlot) => unknown =
  dateTimes.set.bind(dateTimes)
export const getTimeSlot: (value: object) => bigint | undefined =
  import.meta.formatjsTemporalNativeData === true
    ? value => {
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

const yearMonths = new WeakMap<object, DateSlot>()
const monthDays = new WeakMap<object, DateSlot>()
export const getYearMonthSlot: (value: object) => DateSlot | undefined =
  yearMonths.get.bind(yearMonths)
export const setYearMonthSlot: (value: object, slot: DateSlot) => unknown =
  yearMonths.set.bind(yearMonths)
export const getMonthDaySlot: (value: object) => DateSlot | undefined =
  monthDays.get.bind(monthDays)
export const setMonthDaySlot: (value: object, slot: DateSlot) => unknown =
  monthDays.set.bind(monthDays)

export interface ZonedSlot extends DateTimeSlot {
  readonly timeZone: string
}
const zonedDates = new WeakMap<object, ZonedSlot>()
export const getZonedSlot: (value: object) => ZonedSlot | undefined =
  zonedDates.get.bind(zonedDates)
export const setZonedSlot: (value: object, slot: ZonedSlot) => unknown =
  zonedDates.set.bind(zonedDates)

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
