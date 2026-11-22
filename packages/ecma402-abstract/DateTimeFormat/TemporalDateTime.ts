import {
  DayFromYear,
  DaysInYear,
} from '#packages/ecma262-abstract/DateOperations.js'

import {ToString} from '#packages/ecma262-abstract/ToString.js'
import {bigIntFrom, numberFrom} from '#packages/ecma262-abstract/intrinsics.js'
import type {TemporalDateTimeKind} from '#packages/ecma402-abstract/types/date-time.js'

export interface TemporalDateTimeValue {
  kind: TemporalDateTimeKind
  calendar?: string
  epochNanoseconds: bigint
}

// Internal bridge for Temporal §15.6.12 IsTemporalObject slot checks.
// Captured intrinsics recognize brands without reading instance properties.
// https://tc39.es/proposal-temporal/#sec-temporal-istemporalobject
export type TemporalDateTimeNamespace = Record<
  TemporalDateTimeKind,
  {prototype: object}
>
const readers: {
  kind: TemporalDateTimeKind
  read: (this: unknown, options?: object) => string | bigint
}[] = []
const registered = new WeakSet<object>()

export function registerTemporalDateTimeNamespace(
  temporal: TemporalDateTimeNamespace
): void {
  if (registered.has(temporal)) return
  const additions = (
    [
      'PlainDate',
      'PlainYearMonth',
      'PlainMonthDay',
      'PlainTime',
      'PlainDateTime',
      'Instant',
      'ZonedDateTime',
    ] as const
  ).map(kind => ({
    kind,
    read:
      kind === 'Instant' || kind === 'ZonedDateTime'
        ? Object.getOwnPropertyDescriptor(
            temporal[kind].prototype,
            'epochNanoseconds'
          )!.get!
        : (Object.getOwnPropertyDescriptor(
            temporal[kind].prototype,
            'toString'
          )!.value as (this: unknown, options?: object) => string),
  }))
  readers.push(...additions)
  registered.add(temporal)
}
const temporal = (
  globalThis as typeof globalThis & {Temporal?: TemporalDateTimeNamespace}
).Temporal
if (temporal) registerTemporalDateTimeNamespace(temporal)
const stringOptions = {__proto__: null, calendarName: 'always'}
const dateGetTime = Date.prototype.getTime
const apply = Reflect.apply
const stringIndexOf = Function.prototype.call.bind(
  String.prototype.indexOf
) as (value: string, search: string) => number
const stringSlice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end?: number
) => string
const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

// Temporal comparison §15.6.11 steps1–2: retain brands; other inputs use ToNumber.
// Numeric conversion delegates to unary + (ECMA-262 §7.1.4 and §13.5.4.1).
// Normalizing branded values to records here is an internal implementation choice.
// https://tc39.es/proposal-temporal/#sec-todatetimeformattable
export function ToDateTimeFormattable(
  value: unknown
): number | TemporalDateTimeValue {
  if (value !== null && typeof value === 'object' && readers.length) {
    let isDate = false
    try {
      apply(dateGetTime, value, [])
      isDate = true
    } catch {
      // A non-Date may still carry a Temporal brand.
    }
    if (isDate) return +(value as unknown as number)
    // Temporal comparison §15.6.11 step1: private brand probes add no iterator Get.
    // https://tc39.es/proposal-temporal/#sec-todatetimeformattable
    for (let index = 0; index < readers.length; index++) {
      const {kind, read} = readers[index]
      let result: string | bigint
      try {
        result = apply(read, value, [stringOptions])
      } catch {
        continue
      }
      // Comparison §15.6.20 step2: preserve the exact Instant slot value.
      if (kind === 'Instant' || kind === 'ZonedDateTime') {
        return {
          kind,
          epochNanoseconds: bigIntFrom(result),
        }
      }
      // Comparison §15.6.11 step1: private brand serialization adds no user hooks.
      // Comparison §§9.5.6/10.5.3 step4: always preserves ISO reference dates.
      // https://tc39.es/proposal-temporal/#sec-temporal-temporalyearmonthtostring
      // https://tc39.es/proposal-temporal/#sec-temporal-temporalmonthdaytostring
      const text = ToString(result)
      const calendarStart = stringIndexOf(text, '[u-ca=')
      const calendar =
        calendarStart < 0 ? undefined : stringSlice(text, calendarStart + 6, -1)
      const yearEnd = text[0] === '+' || text[0] === '-' ? 7 : 4
      // Comparison §15.6.18 step1: anchor PlainTime to 1970-01-01.
      // https://tc39.es/proposal-temporal/#sec-temporal-handledatetimetemporaltime
      let epochNanoseconds = 0n
      // Comparison §14.6.1 steps1–5: exact ISO day and clock composition.
      // https://tc39.es/proposal-temporal/#sec-getutcepochnanoseconds
      if (kind !== 'PlainTime') {
        const year = numberFrom(stringSlice(text, 0, yearEnd))
        const month = numberFrom(stringSlice(text, yearEnd + 1, yearEnd + 3))
        const day = numberFrom(stringSlice(text, yearEnd + 4, yearEnd + 6))
        const days =
          DayFromYear(year) +
          monthStarts[month - 1] +
          day -
          1 +
          (month > 2 && DaysInYear(year) === 366 ? 1 : 0)
        epochNanoseconds = bigIntFrom(days) * 86_400_000_000_000n
      }
      if (kind === 'PlainTime' || kind === 'PlainDateTime') {
        const timeStart = kind === 'PlainTime' ? 0 : yearEnd + 7
        const hour = numberFrom(stringSlice(text, timeStart, timeStart + 2))
        const minute = numberFrom(
          stringSlice(text, timeStart + 3, timeStart + 5)
        )
        const second = numberFrom(
          stringSlice(text, timeStart + 6, timeStart + 8)
        )
        const fraction =
          text[timeStart + 8] === '.'
            ? stringSlice(
                text,
                timeStart + 9,
                calendarStart < 0 ? undefined : calendarStart
              )
            : ''
        epochNanoseconds +=
          bigIntFrom(hour * 3600 + minute * 60 + second) * 1_000_000_000n +
          bigIntFrom(stringSlice(fraction + '000000000', 0, 9))
      } else {
        // Comparison §§15.6.15–15.6.17 step2: combine date-only values with noon.
        // https://tc39.es/proposal-temporal/#sec-temporal-handledatetimetemporaldate
        epochNanoseconds += 43_200_000_000_000n
      }
      return {kind, calendar, epochNanoseconds}
    }
  }
  return +(value as number)
}
