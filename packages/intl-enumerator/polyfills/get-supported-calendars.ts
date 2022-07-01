import type {Calendar} from '../data/calendars'
import {calendars} from '../data/calendars'

function isSupportedCalendar(item: Calendar): boolean {
  try {
    const dateTimeFormat = new Intl.DateTimeFormat('en-u-ca' + item)
    const options = dateTimeFormat.resolvedOptions().calendar

    if (item !== 'gregory' || options !== 'gregory') return true
  } catch (_err) {}

  return false
}

export function getSupportedCalendars(): Calendar[] {
  return calendars.filter(isSupportedCalendar)
}
