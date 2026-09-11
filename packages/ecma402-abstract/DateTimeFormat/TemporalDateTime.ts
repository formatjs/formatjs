import Decimal from '@formatjs/bigdecimal'
import {ToNumber} from '#packages/ecma262-abstract/ToNumber.js'
import {
  DayFromYear,
  DaysInYear,
} from '#packages/ecma262-abstract/DateOperations.js'

import type {TemporalDateTimeKind} from '#packages/ecma402-abstract/types/date-time.js'

export interface TemporalDateTimeValue {
  kind: TemporalDateTimeKind
  calendar?: string
  milliseconds: Decimal
}

// Intrinsic calls check internal slots across realms without reading user properties.
// https://tc39.es/proposal-temporal/#sec-temporal-istemporalobject
const temporal = (
  globalThis as typeof globalThis & {
    Temporal?: Record<TemporalDateTimeKind, {prototype: object}>
  }
).Temporal
const readers = temporal
  ? (
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
            )!.value as (this: unknown, options: object) => string),
    }))
  : []
const stringOptions = Object.assign(Object.create(null), {
  calendarName: 'always',
})
const CALENDAR_ANNOTATION = /\[u-ca=([^\]]+)\]/
const ISO_DATE = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})/
const ISO_TIME = /(?:^|T)(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/
const dateGetTime = Date.prototype.getTime
const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

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
          milliseconds: new Decimal(String(result)).div(1000000).floor(),
        }
      }
      // calendarName=always includes the ISO reference date for YearMonth/MonthDay.
      // Parsing this intrinsic result avoids Date's TimeClip and user-defined coercion.
      const text = String(result)
      const calendar = CALENDAR_ANNOTATION.exec(text)?.[1]
      const date = ISO_DATE.exec(text)
      const time = ISO_TIME.exec(text)
      let milliseconds = 0
      if (date) {
        const year = Number(date[1])
        const month = Number(date[2])
        const days =
          DayFromYear(year) +
          monthStarts[month - 1] +
          Number(date[3]) -
          1 +
          (month > 2 && DaysInYear(year) === 366 ? 1 : 0)
        milliseconds = days * 86400000
      }
      if (time) {
        milliseconds +=
          Number(time[1]) * 3600000 +
          Number(time[2]) * 60000 +
          Number(time[3]) * 1000 +
          Number(((time[4] || '') + '000').slice(0, 3))
      } else {
        milliseconds += 43200000
      }
      return {kind, calendar, milliseconds: new Decimal(milliseconds)}
    }
  }
  return ToNumber(value)
}
