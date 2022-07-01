import {getSupportedCalendars} from './polyfills/get-supported-calendars'
import {getSupportedCurrencies} from './polyfills/get-supported-currencies'
import {getSupportedNumberingSystems} from './polyfills/get-supported-numbering-systems'
import {getSupportedRegions} from './polyfills/get-supported-regions'
import {getSupportedScripts} from './polyfills/get-supported-scripts'
import {getSupportedTimeZones} from './polyfills/get-supported-timezones'
import {getSupportedUnits} from './polyfills/get-supported-units'

Object.defineProperty(Intl, 'getSupportedCalendars', {
  value: getSupportedCalendars,
  enumerable: true,
  writable: false,
  configurable: false,
})

Object.defineProperty(Intl, 'getSupportedCurrencies', {
  value: getSupportedCurrencies,
  enumerable: true,
  writable: false,
  configurable: false,
})

Object.defineProperty(Intl, 'getSupportedNumberingSystems', {
  value: getSupportedNumberingSystems,
  enumerable: true,
  writable: false,
  configurable: false,
})

Object.defineProperty(Intl, 'getSupportedRegions', {
  value: getSupportedRegions,
  enumerable: true,
  writable: false,
  configurable: false,
})

Object.defineProperty(Intl, 'getSupportedScripts', {
  value: getSupportedScripts,
  enumerable: true,
  writable: false,
  configurable: false,
})

Object.defineProperty(Intl, 'getSupportedTimeZones', {
  value: getSupportedTimeZones,
  enumerable: true,
  writable: false,
  configurable: false,
})

Object.defineProperty(Intl, 'getSupportedUnits', {
  value: getSupportedUnits,
  enumerable: true,
  writable: false,
  configurable: false,
})
