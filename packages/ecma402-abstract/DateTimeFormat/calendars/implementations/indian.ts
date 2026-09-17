import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {getIndian} from 'temporal-polyfill/fns/Calendar'
import {temporalCalendar} from '#packages/ecma402-abstract/DateTimeFormat/calendars/temporal.js'

const data: CalendarData = temporalCalendar('indian', getIndian)

export default data
