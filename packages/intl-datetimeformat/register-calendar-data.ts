import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'

/** Register after installation, or queue until the polyfill is installed. */
export function registerCalendarData(...data: CalendarData[]): void {
  const dtf = globalThis.Intl?.DateTimeFormat as typeof Intl.DateTimeFormat & {
    __addCalendarData?: (...data: CalendarData[]) => void
  }
  if (typeof dtf?.__addCalendarData === 'function') {
    dtf.__addCalendarData(...data)
  } else {
    const globals = globalThis as typeof globalThis & {
      __FORMATJS_DATETIMEFORMAT_CALENDAR_DATA__?: CalendarData[]
    }
    ;(globals.__FORMATJS_DATETIMEFORMAT_CALENDAR_DATA__ ??= []).push(...data)
  }
}
