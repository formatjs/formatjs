import type {Calendar} from './calendars.generated'
import {calendars} from './calendars.generated'

function isSupportedCalendar(item: Calendar, locale: string = 'en'): boolean {
  try {
    const dateTimeFormat = new Intl.DateTimeFormat(`${locale}-u-ca-${item}`)
    const options = dateTimeFormat.resolvedOptions().calendar

    if (item !== 'gregory' || options !== 'gregory') return true
  } catch (_err) {}

  return false
}

export function getSupportedCalendars(localePrefix?: string): Calendar[] {
  return calendars.filter(calendar =>
    isSupportedCalendar(calendar, localePrefix)
  )
}
