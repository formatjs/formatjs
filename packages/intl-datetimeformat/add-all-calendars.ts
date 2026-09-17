import data from '#packages/intl-datetimeformat/calendars/all.js'
import {registerCalendarData} from '#packages/intl-datetimeformat/register-calendar-data.js'

registerCalendarData(...data)
export default data
