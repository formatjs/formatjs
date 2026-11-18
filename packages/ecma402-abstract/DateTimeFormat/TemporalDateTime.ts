import type Decimal from '@formatjs/bigdecimal'
import {ToNumber} from '#packages/ecma262-abstract/ToNumber.js'
import {
  DayFromYear,
  DaysInYear,
} from '#packages/ecma262-abstract/DateOperations.js'

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
const stringOptions = Object.assign(Object.create(null), {
  calendarName: 'always',
})
const dateGetTime = Date.prototype.getTime
const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

// Temporal §15.6.11 preserves Temporal brands; other inputs use ToNumber.
// Normalizing branded values to records here is an internal implementation choice.
// https://tc39.es/proposal-temporal/#sec-todatetimeformattable
export function ToDateTimeFormattable(
  value: unknown
): Decimal | TemporalDateTimeValue {
  if (value !== null && typeof value === 'object' && readers.length) {
    let isDate = false
    try {
      dateGetTime.call(value)
      isDate = true
    } catch {
      // A non-Date may still carry a Temporal brand.
    }
    if (isDate) return ToNumber(value)
    for (const {kind, read} of readers) {
      let result: string | bigint
      try {
        result = read.call(value, stringOptions)
      } catch {
        continue
      }
      if (kind === 'Instant' || kind === 'ZonedDateTime') {
        return {
          kind,
          epochNanoseconds: BigInt(result),
        }
      }
      // Internal slot bridge: scan captured intrinsic output without touching RegExp statics.
      // calendarName=always preserves reference dates (Temporal §9.5.6 / §10.5.3, step 4).
      // https://tc39.es/proposal-temporal/#sec-temporal-temporalyearmonthtostring
      // https://tc39.es/proposal-temporal/#sec-temporal-temporalmonthdaytostring
      const text = String(result)
      const calendarStart = text.indexOf('[u-ca=')
      const calendar =
        calendarStart < 0 ? undefined : text.slice(calendarStart + 6, -1)
      const yearEnd = text[0] === '+' || text[0] === '-' ? 7 : 4
      // Temporal §15.6.18, step 1 anchors PlainTime to 1970-01-01.
      // https://tc39.es/proposal-temporal/#sec-temporal-handledatetimetemporaltime
      let epochNanoseconds = BigInt(0)
      if (kind !== 'PlainTime') {
        const year = Number(text.slice(0, yearEnd))
        const month = Number(text.slice(yearEnd + 1, yearEnd + 3))
        const day = Number(text.slice(yearEnd + 4, yearEnd + 6))
        const days =
          DayFromYear(year) +
          monthStarts[month - 1] +
          day -
          1 +
          (month > 2 && DaysInYear(year) === 366 ? 1 : 0)
        epochNanoseconds = BigInt(days) * BigInt(86400000000000)
      }
      if (kind === 'PlainTime' || kind === 'PlainDateTime') {
        const timeStart = kind === 'PlainTime' ? 0 : yearEnd + 7
        const hour = Number(text.slice(timeStart, timeStart + 2))
        const minute = Number(text.slice(timeStart + 3, timeStart + 5))
        const second = Number(text.slice(timeStart + 6, timeStart + 8))
        const fraction =
          text[timeStart + 8] === '.'
            ? text.slice(
                timeStart + 9,
                calendarStart < 0 ? undefined : calendarStart
              )
            : ''
        epochNanoseconds +=
          BigInt(hour * 3600 + minute * 60 + second) * BigInt(1000000000) +
          BigInt((fraction + '000000000').slice(0, 9))
      } else {
        // Temporal §15.6.15–17, step 2 combines date-only values with noon.
        // https://tc39.es/proposal-temporal/#sec-temporal-handledatetimetemporaldate
        epochNanoseconds += BigInt(43200000000000)
      }
      return {kind, calendar, epochNanoseconds}
    }
  }
  return ToNumber(value)
}
