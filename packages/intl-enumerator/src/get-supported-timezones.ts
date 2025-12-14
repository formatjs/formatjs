import {createMemoizedDateTimeFormat} from '@formatjs/ecma402-abstract'
import type {Timezone} from './timezones.generated.js'
import {timezones} from './timezones.generated.js'

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
