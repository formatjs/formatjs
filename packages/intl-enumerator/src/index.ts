import {getSupportedCalendars} from './get-supported-calendars'
import {getSupportedCollations} from './get-supported-collations'
import {getSupportedCurrencies} from './get-supported-currencies'
import {getSupportedNumberingSystems} from './get-supported-numbering-systems'
import {getSupportedTimeZones} from './get-supported-timezones'
import {getSupportedUnits} from './get-supported-units'

export type SupportedValuesOf =
  | 'calendar'
  | 'collation'
  | 'currency'
  | 'numberingSystem'
  | 'timeZone'
  | 'unit'

export function supportedValuesOf(
  key: SupportedValuesOf,
  locale?: string
): string[] {
  switch (key) {
    case 'calendar':
      return getSupportedCalendars(locale)
    case 'collation':
      return getSupportedCollations(locale)
    case 'currency':
      return getSupportedCurrencies(locale)
    case 'numberingSystem':
      return getSupportedNumberingSystems(locale)
    case 'timeZone':
      return getSupportedTimeZones(locale)
    case 'unit':
      return getSupportedUnits(locale)
    default:
      throw RangeError('Invalid key: ' + key)
  }
}
