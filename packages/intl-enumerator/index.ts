export type {Calendar} from './data/calendars'
export type {Currency} from './data/currencies'
export type {NumberingSystem} from './data/numbering-systems'
export type {Region} from './data/regions'
export type {Script} from './data/scripts'
export type {Timezone} from './data/timezones'
export type {Unit} from './data/units'

import {shouldPolyfill} from './should-polyfill'
import {getSupportedCalendars} from './polyfills/get-supported-calendars'
import {getSupportedCurrencies} from './polyfills/get-supported-currencies'
import {getSupportedNumberingSystems} from './polyfills/get-supported-numbering-systems'
import {getSupportedRegions} from './polyfills/get-supported-regions'
import {getSupportedScripts} from './polyfills/get-supported-scripts'
import {getSupportedTimeZones} from './polyfills/get-supported-timezones'
import {getSupportedUnits} from './polyfills/get-supported-units'

if (shouldPolyfill('getSupportedCalendars')) {
  Object.defineProperty(Intl, 'getSupportedCalendars', {
    value: getSupportedCalendars,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}

if (shouldPolyfill('getSupportedCurrencies')) {
  Object.defineProperty(Intl, 'getSupportedCurrencies', {
    value: getSupportedCurrencies,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}

if (shouldPolyfill('getSupportedNumberingSystems')) {
  Object.defineProperty(Intl, 'getSupportedNumberingSystems', {
    value: getSupportedNumberingSystems,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}

if (shouldPolyfill('getSupportedRegions')) {
  Object.defineProperty(Intl, 'getSupportedRegions', {
    value: getSupportedRegions,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}

if (shouldPolyfill('getSupportedScripts')) {
  Object.defineProperty(Intl, 'getSupportedScripts', {
    value: getSupportedScripts,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}

if (shouldPolyfill('getSupportedTimeZones')) {
  Object.defineProperty(Intl, 'getSupportedTimeZones', {
    value: getSupportedTimeZones,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}

if (shouldPolyfill('getSupportedUnits')) {
  Object.defineProperty(Intl, 'getSupportedUnits', {
    value: getSupportedUnits,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}
