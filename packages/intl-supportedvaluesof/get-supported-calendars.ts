import {arrayIndexOf, arraySome} from '#packages/ecma262-abstract/intrinsics.js'
import {supportedEntries} from '#packages/intl-supportedvaluesof/supported-entries.js'
import {getDateTimeFormatProbe} from '#packages/intl-supportedvaluesof/memoize.js'
import {
  type Calendar,
  calendarCandidateLocales,
  calendars,
} from '@formatjs_generated/cldr.supported-values/calendars.js'

// ECMA-402 §8.3.2 step 2.b filters §6.9.1 to canonical calendar identifiers.
// ISO 8601 is required even without a formatter probe.
// https://tc39.es/ecma402/#sec-calendar-types
// https://tc39.es/ecma402/#sec-intl.supportedvaluesof
// https://tc39.es/ecma402/#sec-availablecalendars
export function getSupportedCalendars(): Calendar[] {
  const probe = getDateTimeFormatProbe()
  if (probe?.availableCalendars) {
    const available = probe.availableCalendars()
    return supportedEntries(
      calendars,
      calendar =>
        calendar === 'iso8601' || arrayIndexOf(available, calendar) >= 0
    )
  }
  if (!probe?.resolve) return ['iso8601']
  const {create, resolve} = probe
  return supportedEntries(calendars, calendar => {
    if (calendar === 'iso8601') return true
    // §6.9.1 includes calendars supported in any locale. Probe CLDR candidates
    // when the formatter cannot enumerate its calendars directly.
    // §9.2.7 steps 3 and 11 still apply an explicit calendar after locale fallback.
    // https://tc39.es/ecma402/#sec-resolvelocale
    const options = {__proto__: null, calendar}
    return arraySome(calendarCandidateLocales[calendar], locale => {
      try {
        return (
          resolve(create(`${locale}-u-ca-${calendar}`, options)).calendar ===
          calendar
        )
      } catch {
        return false
      }
    })
  })
}
