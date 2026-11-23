import {arrayIndexOf} from '#packages/ecma262-abstract/intrinsics.js'
const CODES_FOR_DATE_TIME_FIELD: Array<string> = [
  'era',
  'year',
  'quarter',
  'month',
  'weekOfYear',
  'weekday',
  'day',
  'dayPeriod',
  'hour',
  'minute',
  'second',
  'timeZoneName',
]

export function IsValidDateTimeFieldCode(field: string): boolean {
  return arrayIndexOf(CODES_FOR_DATE_TIME_FIELD, field) >= 0
}
