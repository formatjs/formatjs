import {DateTimeFormat} from './'
import {defineProperty} from '@formatjs/ecma402-abstract'
import {
  toLocaleString as _toLocaleString,
  toLocaleDateString as _toLocaleDateString,
  toLocaleTimeString as _toLocaleTimeString,
} from './src/to_locale_string'

defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat})
defineProperty(Date.prototype, 'toLocaleString', {
  value: function toLocaleString(
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    try {
      return _toLocaleString(this, locales, options)
    } catch (error) {
      return 'Invalid Date'
    }
  },
})
defineProperty(Date.prototype, 'toLocaleDateString', {
  value: function toLocaleDateString(
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    try {
      return _toLocaleDateString(this, locales, options)
    } catch (error) {
      return 'Invalid Date'
    }
  },
})
defineProperty(Date.prototype, 'toLocaleTimeString', {
  value: function toLocaleTimeString(
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ) {
    try {
      return _toLocaleTimeString(this, locales, options)
    } catch (error) {
      return 'Invalid Date'
    }
  },
})
