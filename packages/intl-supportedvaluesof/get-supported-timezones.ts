import {supportedEntries} from '#packages/intl-supportedvaluesof/supported-entries.js'
import {getDateTimeFormatProbe} from '#packages/intl-supportedvaluesof/memoize.js'
import type {Timezone} from '@formatjs_generated/cldr.supported-values/timezones.js'
import {timezones} from '@formatjs_generated/cldr.supported-values/timezones.js'

// ECMA-402 §8.3.2 step 6 returns the available primary time-zone identifiers.
// https://tc39.es/ecma402/#sec-availableprimarytimezoneidentifiers
export function getSupportedTimeZones(): Timezone[] {
  const probe = getDateTimeFormatProbe()
  if (!probe) return []
  if (probe.hasTimeZone) return supportedEntries(timezones, probe.hasTimeZone)
  const {create} = probe
  return supportedEntries(timezones, timeZone => {
    try {
      const options = {__proto__: null, timeZone}
      create('en', options)
      return true
    } catch {
      return false
    }
  })
}
