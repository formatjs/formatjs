export interface DateSlot {
  readonly epochDay: number
  readonly calendar: string
}
export interface DateTimeSlot {
  readonly epochNanoseconds: bigint
  readonly calendar: string
}
const dates = new WeakMap<object, DateSlot>()
const dateTimes = new WeakMap<object, DateTimeSlot>()
const times = new WeakMap<object, bigint>()
export const getDateSlot: (value: object) => DateSlot | undefined =
  dates.get.bind(dates)
export const setDateSlot: (value: object, slot: DateSlot) => unknown =
  dates.set.bind(dates)
export const getDateTimeSlot: (value: object) => DateTimeSlot | undefined =
  dateTimes.get.bind(dateTimes)
export const setDateTimeSlot: (value: object, slot: DateTimeSlot) => unknown =
  dateTimes.set.bind(dateTimes)
export const getTimeSlot: (value: object) => bigint | undefined =
  times.get.bind(times)
export const setTimeSlot: (value: object, slot: bigint) => unknown =
  times.set.bind(times)
