import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  type DateTimeFormatLocaleInternalData,
  type IntlDateTimeFormatInternal,
  type TABLE_6,
} from '#packages/ecma402-abstract/types/date-time.js'

// ECMA-402 §11.2.3 says locale data contains calendar-indexed Records.
// https://tc39.es/ecma402/#sec-intl.datetimeformat-internal-slots
export function calendarLocaleData(
  data: DateTimeFormatLocaleInternalData,
  calendar: string | undefined
): DateTimeFormatLocaleInternalData {
  if (calendar !== undefined && HasOwnProperty(data, 'calendarData')) {
    const names = data.calendarData
    if (names && HasOwnProperty(names, calendar)) return names[calendar] ?? data
  }
  return data
}

// ECMA-402 §11.1.2 step 25 and §11.5.2 step 10.b both use Table 16 order.
// https://tc39.es/ecma402/#table-datetimeformat-components
export const DATE_TIME_PROPS: Array<
  keyof Pick<IntlDateTimeFormatInternal, TABLE_6>
> = [
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'dayPeriod',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
  'timeZoneName',
]

// ECMA-402 §11.5.2 steps 1–7 define the basic matcher penalties.
// https://tc39.es/ecma402/#sec-basicformatmatcher
export const removalPenalty = 120
export const additionPenalty = 20
export const differentNumericTypePenalty = 15
export const longLessPenalty = 8
export const longMorePenalty = 6
export const shortLessPenalty = 6
export const shortMorePenalty = 3
export const offsetPenalty = 1
