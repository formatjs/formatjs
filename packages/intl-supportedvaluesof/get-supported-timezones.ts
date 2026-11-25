import {supportedEntries} from '#packages/intl-supportedvaluesof/supported-entries.js'
import {getDateTimeFormatProbe} from '#packages/intl-supportedvaluesof/memoize.js'
import type {Timezone} from '@formatjs_generated/cldr.supported-values/timezones.js'
import {timezones} from '@formatjs_generated/cldr.supported-values/timezones.js'

// ECMA-402 §8.3.2 step 6 returns the available primary time-zone identifiers.
// §6.5.1 step 6 requires UTC even without a formatter probe.
// https://tc39.es/ecma402/#sec-availableprimarytimezoneidentifiers
// https://tc39.es/ecma402/#sup-availablenamedtimezoneidentifiers
export function getSupportedTimeZones(): Timezone[] {
  const probe = getDateTimeFormatProbe()
  if (!probe) return ['UTC']
  return supportedEntries(timezones, timeZone => {
    if (timeZone === 'UTC') return true
    if (probe.hasTimeZone) {
      try {
        return probe.hasTimeZone(timeZone)
      } catch {
        // Fall back to construction if optional time-zone metadata fails.
      }
    }
    try {
      const options = {__proto__: null, timeZone}
      probe.create('en', options)
      return true
    } catch {
      return false
    }
  })
}
