import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  bigIntFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {TimeClip} from '#packages/ecma262-abstract/TimeClip.js'
import type {IntlDateTimeFormatInternal} from '#packages/ecma402-abstract/types/date-time.js'
import type {TemporalDateTimeValue} from '#packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.js'

export type DateTimeFormattable = number | TemporalDateTimeValue

export function isTemporalDateTimeValue(
  value: DateTimeFormattable
): value is TemporalDateTimeValue {
  return typeof value !== 'number'
}

/** https://tc39.es/proposal-temporal/#sec-temporal-value-format-records */
export interface ValueFormatRecord {
  format: IntlDateTimeFormatInternal
  epochNanoseconds: bigint
  isPlain: boolean
}

/** https://tc39.es/proposal-temporal/#sec-temporal-handledatetimevalue */
export function HandleDateTimeValue(
  slots: IntlDateTimeFormatInternal,
  value: DateTimeFormattable
): ValueFormatRecord {
  if (!isTemporalDateTimeValue(value)) {
    // Temporal Intl §15.6.21 steps 1–5 clip Number inputs before making the record.
    // https://tc39.es/proposal-temporal/#sec-temporal-handledatetimeothers
    const clipped = TimeClip(value)
    if (clipped !== clipped) throw new RangeErrorConstructor('Invalid time')
    return {
      format: slots,
      epochNanoseconds: bigIntFrom(clipped) * bigIntFrom(1_000_000),
      isPlain: false,
    }
  }
  if (value.kind === 'ZonedDateTime') {
    throw new TypeErrorConstructor(
      'Temporal.ZonedDateTime is not supported by DateTimeFormat'
    )
  }
  // Temporal Intl §§15.6.16–17 step 1 require an exact calendar match for short dates.
  // https://tc39.es/proposal-temporal/#sec-temporal-handledatetimetemporalyearmonth
  // https://tc39.es/proposal-temporal/#sec-temporal-handledatetimetemporalmonthday
  if (
    value.calendar !== undefined &&
    value.calendar !== slots.calendar &&
    (value.calendar !== 'iso8601' ||
      value.kind === 'PlainYearMonth' ||
      value.kind === 'PlainMonthDay')
  ) {
    throw new RangeErrorConstructor(
      'Temporal calendar does not match DateTimeFormat'
    )
  }
  // For short dates, epochNanoseconds already includes noon (steps 2–3).
  // Temporal Intl §15.6.20 steps 1–2 keep the Instant's exact epoch and mark it non-plain.
  // https://tc39.es/proposal-temporal/#sec-temporal-handledatetimetemporalinstant
  return {
    format: slots.getTemporalFormat!(value.kind),
    epochNanoseconds: value.epochNanoseconds,
    isPlain: value.kind !== 'Instant',
  }
}
