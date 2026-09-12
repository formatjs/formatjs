import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import {getEthiopic} from 'temporal-polyfill/fns/Calendar'
import {temporalCalendar} from '#packages/ecma402-abstract/DateTimeFormat/calendars/temporal.js'

const data: CalendarData = temporalCalendar('ethiopic', getEthiopic)

export default data
