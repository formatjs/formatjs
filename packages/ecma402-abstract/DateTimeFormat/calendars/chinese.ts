import {chinese} from '@formatjs_generated/icu.calendar/chinese.js'
import {LunisolarDateFromTime} from '#packages/ecma402-abstract/DateTimeFormat/LunisolarDateFromTime.js'
import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'

const data: CalendarData = {
  calendar: 'chinese',
  dateFromTime: t => LunisolarDateFromTime(t, chinese),
}

export default data
