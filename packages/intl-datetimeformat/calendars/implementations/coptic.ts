import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {getCoptic} from 'temporal-polyfill/fns/Calendar'
import {temporalCalendar} from '#packages/intl-datetimeformat/calendars/temporal.js'

const data: CalendarData = temporalCalendar('coptic', getCoptic)

export default data
