import data from '#packages/ecma402-abstract/DateTimeFormat/calendars/implementations/islamic-civil.js'
import {registerCalendarData} from '#packages/intl-datetimeformat/register-calendar-data.js'

registerCalendarData(data)
export default data
