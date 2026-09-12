import data from '#packages/ecma402-abstract/DateTimeFormat/calendars/islamic-tbla.js'
import {registerCalendarData} from '#packages/intl-datetimeformat/calendar-data/register.js'

registerCalendarData(data)
export default data
