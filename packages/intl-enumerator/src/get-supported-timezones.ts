import {createMemoizedDateTimeFormat} from '@formatjs/ecma402-abstract'
import type {Timezone} from './timezones.generated'
import {timezones} from './timezones.generated'

function isSupported(timeZone: Timezone, locale: string = 'en'): boolean {
  try {
    const formatter = createMemoizedDateTimeFormat(locale, {timeZone})
    return formatter.resolvedOptions().timeZone === timeZone
  } catch {}

  return false
}

export function getSupportedTimeZones(locale?: string): Timezone[] {
  return timezones.filter(timezone => isSupported(timezone, locale))
}
