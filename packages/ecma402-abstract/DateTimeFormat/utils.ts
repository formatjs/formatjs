import {IntlDateTimeFormatInternal, TABLE_6} from '../types/date-time'

export const DATE_TIME_PROPS: Array<
  keyof Pick<IntlDateTimeFormatInternal, TABLE_6>
> = [
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'timeZoneName',
]

export const removalPenalty = 120
export const additionPenalty = 20
export const differentNumericTypePenalty = 15
export const longLessPenalty = 8
export const longMorePenalty = 6
export const shortLessPenalty = 6
export const shortMorePenalty = 3
