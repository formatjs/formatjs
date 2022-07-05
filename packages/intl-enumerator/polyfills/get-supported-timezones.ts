import type {Timezone} from '../data/timezones'
import {timezones} from '../data/timezones'

function isSupported(timeZone: Timezone): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en', {timeZone})
    return formatter.resolvedOptions().timeZone === timeZone
  } catch (_err) {}

  return false
}

export function getSupportedTimeZones(): Timezone[] {
  return timezones.filter(isSupported)
}
