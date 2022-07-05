import type {Timezone} from './timezones.generated'
import {timezones} from './timezones.generated'

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
