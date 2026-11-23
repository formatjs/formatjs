import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {arithmeticCalendar} from '#packages/intl-datetimeformat/calendars/arithmetic.js'

const data: CalendarData = arithmeticCalendar('islamic-tbla')

export default data
