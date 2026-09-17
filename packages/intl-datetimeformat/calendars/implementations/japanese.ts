import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {getJapanese} from 'temporal-polyfill/fns/Calendar'
import {temporalCalendar} from '#packages/intl-datetimeformat/calendars/temporal.js'

const data: CalendarData = temporalCalendar('japanese', getJapanese)

export default data
