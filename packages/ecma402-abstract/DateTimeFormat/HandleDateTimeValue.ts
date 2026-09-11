import {TimeClip} from '#packages/ecma262-abstract/TimeClip.js'
import type Decimal from '@formatjs/bigdecimal'
import type {IntlDateTimeFormatInternal} from '#packages/ecma402-abstract/types/date-time.js'
import type {TemporalDateTimeValue} from '#packages/ecma402-abstract/DateTimeFormat/TemporalDateTime.js'

export type DateTimeFormattable = Decimal | TemporalDateTimeValue

export function isTemporalDateTimeValue(
  value: DateTimeFormattable
): value is TemporalDateTimeValue {
  return Object.prototype.hasOwnProperty.call(value, 'kind')
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
    // HandleDateTimeOthers clips Number inputs before creating the record.
    const clipped = TimeClip(value)
    if (clipped.isNaN()) throw new RangeError('Invalid time')
    return {
      format: slots,
      epochNanoseconds: BigInt(clipped.toNumber()) * BigInt(1000000),
      isPlain: false,
    }
  }
  if (value.kind === 'ZonedDateTime') {
    throw new TypeError(
      'Temporal.ZonedDateTime is not supported by DateTimeFormat'
    )
  }
  if (
    value.calendar !== undefined &&
    value.calendar !== slots.calendar &&
    (value.calendar !== 'iso8601' ||
      value.kind === 'PlainYearMonth' ||
      value.kind === 'PlainMonthDay')
  ) {
    throw new RangeError('Temporal calendar does not match DateTimeFormat')
  }
  return {
    format: slots.getTemporalFormat!(value.kind),
    epochNanoseconds: value.epochNanoseconds,
    isPlain: value.kind !== 'Instant',
  }
}
