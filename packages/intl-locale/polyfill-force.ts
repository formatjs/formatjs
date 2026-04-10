import {Locale} from '#packages/intl-locale/index.js'

Object.defineProperty(Intl, 'Locale', {
  value: Locale,
  writable: true,
  enumerable: false,
  configurable: true,
})
