import {createMemoizedDateTimeFormat} from '@formatjs/ecma402-abstract'
import type {Calendar} from './calendars.generated'
import {calendars} from './calendars.generated'

function isSupportedCalendar(item: Calendar, locale: string = 'en'): boolean {
  try {
    const dateTimeFormat = createMemoizedDateTimeFormat(
      `${locale}-u-ca-${item}`
    )
    const options = dateTimeFormat.resolvedOptions().calendar

    if (item !== 'gregory' || options !== 'gregory') return true
  } catch {}

  return false
}

export function getSupportedCalendars(localePrefix?: string): Calendar[] {
  return calendars.filter(calendar =>
    isSupportedCalendar(calendar, localePrefix)
  )
}
