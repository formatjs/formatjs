import {arithmeticCalendars} from '#packages/ecma402-abstract/Calendar/Arithmetic.js'

export const calendarIds: readonly (
  | (typeof arithmeticCalendars)[number]
  | 'chinese'
  | 'dangi'
  | 'islamic-umalqura'
)[] = [...arithmeticCalendars, 'chinese', 'dangi', 'islamic-umalqura']
export type CalendarId = (typeof calendarIds)[number]
