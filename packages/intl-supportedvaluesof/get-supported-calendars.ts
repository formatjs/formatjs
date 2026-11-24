import {arrayIndexOf} from '#packages/ecma262-abstract/intrinsics.js'
import {supportedEntries} from '#packages/intl-supportedvaluesof/supported-entries.js'
import {getDateTimeFormatProbe} from '#packages/intl-supportedvaluesof/memoize.js'
import type {Calendar} from '@formatjs_generated/cldr.supported-values/calendars.js'
import {calendars} from '@formatjs_generated/cldr.supported-values/calendars.js'

// ECMA-402 §8.3.2 step 2.b filters §6.9.1 to canonical calendar identifiers.
// https://tc39.es/ecma402/#sec-calendar-types
// https://tc39.es/ecma402/#sec-intl.supportedvaluesof
// https://tc39.es/ecma402/#sec-availablecalendars
export function getSupportedCalendars(): Calendar[] {
  const probe = getDateTimeFormatProbe()
  if (probe?.availableCalendars) {
    const available = probe.availableCalendars()
    return supportedEntries(
      calendars,
      calendar => arrayIndexOf(available, calendar) >= 0
    )
  }
  if (!probe?.resolve) return []
  const {create, resolve} = probe
  return supportedEntries(calendars, calendar => {
    try {
      return resolve(create(`en-u-ca-${calendar}`)).calendar === calendar
    } catch {
      return false
    }
  })
}
