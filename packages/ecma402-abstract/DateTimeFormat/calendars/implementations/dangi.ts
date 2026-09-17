import {dangi} from '@formatjs_generated/icu.calendar/dangi.js'
import {LunisolarDateFromTime} from '#packages/ecma402-abstract/DateTimeFormat/LunisolarDateFromTime.js'
import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'

const data: CalendarData = {
  calendar: 'dangi',
  dateFromTime: t => LunisolarDateFromTime(t, dangi),
}

export default data
