import {getSupportedCalendars} from './get-supported-calendars'
import {getSupportedCurrencies} from './get-supported-currencies'
import {getSupportedNumberingSystems} from './get-supported-numbering-systems'
import {getSupportedTimeZones} from './get-supported-timezones'
import {getSupportedUnits} from './get-supported-units'

export type SupportedValuesOf =
  | 'calendar'
  | 'currency'
  | 'numberingSystem'
  | 'timeZone'
  | 'unit'

export function supportedValuesOf(key: SupportedValuesOf): string[] {
  switch (key) {
    case 'calendar':
      return getSupportedCalendars()
    case 'currency':
      return getSupportedCurrencies()
    case 'numberingSystem':
      return getSupportedNumberingSystems()
    case 'timeZone':
      return getSupportedTimeZones()
    case 'unit':
      return getSupportedUnits()
    default:
      throw RangeError('Invalid key:' + key)
  }
}
