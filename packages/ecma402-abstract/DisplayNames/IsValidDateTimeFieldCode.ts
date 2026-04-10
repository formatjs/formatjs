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
  return CODES_FOR_DATE_TIME_FIELD.indexOf(field) >= 0
}
