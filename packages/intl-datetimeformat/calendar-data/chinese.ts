import data from '#packages/ecma402-abstract/DateTimeFormat/calendars/chinese.js'
import {registerCalendarData} from '#packages/intl-datetimeformat/calendar-data/register.js'

registerCalendarData(data)
export default data
