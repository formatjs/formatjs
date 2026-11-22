import {arithmeticCalendars} from '#packages/ecma402-abstract/Calendar/Arithmetic.js'

// ECMA-262 preview §22.3.2.1: canonical Temporal calendar membership after alias resolution.
// https://tc39.es/ecma262/pr/3966/#sec-availablecalendars
// ECMA-262 preview §22.3.2: support ISO 8601 and the listed additional calendars.
// https://tc39.es/ecma262/pr/3966/#sec-calendar-identifiers
export const calendarIds: readonly (
  | (typeof arithmeticCalendars)[number]
  | 'chinese'
  | 'dangi'
  | 'islamic-umalqura'
)[] = [...arithmeticCalendars, 'chinese', 'dangi', 'islamic-umalqura']
export type CalendarId = (typeof calendarIds)[number]
