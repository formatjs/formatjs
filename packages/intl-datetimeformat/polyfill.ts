import {DateTimeFormat} from './index.js'
import {defineProperty} from '@formatjs/ecma402-abstract'
import {shouldPolyfill} from './should-polyfill.js'
import {
  toLocaleString as _toLocaleString,
  toLocaleDateString as _toLocaleDateString,
  toLocaleTimeString as _toLocaleTimeString,
} from './src/to_locale_string.js'

if (shouldPolyfill()) {
  defineProperty(Intl, 'DateTimeFormat', {value: DateTimeFormat})
  defineProperty(Date.prototype, 'toLocaleString', {
    value: function toLocaleString(
      locales?: string | string[],
      options: Intl.DateTimeFormatOptions = {
        dateStyle: 'short',
        timeStyle: 'medium',
      }
    ) {
      try {
        return _toLocaleString(this, locales, options)
      } catch {
        return 'Invalid Date'
      }
    },
  })
  defineProperty(Date.prototype, 'toLocaleDateString', {
    value: function toLocaleDateString(
      locales?: string | string[],
      options: Intl.DateTimeFormatOptions = {
        dateStyle: 'short',
      }
    ) {
      try {
        return _toLocaleDateString(this, locales, options)
      } catch {
        return 'Invalid Date'
      }
    },
  })
  defineProperty(Date.prototype, 'toLocaleTimeString', {
    value: function toLocaleTimeString(
      locales?: string | string[],
      options: Intl.DateTimeFormatOptions = {
        timeStyle: 'medium',
      }
    ) {
      try {
        return _toLocaleTimeString(this, locales, options)
      } catch {
        return 'Invalid Date'
      }
    },
  })

  // Drain any locale data that was buffered before polyfill loaded
  const buf = (globalThis as Record<string, unknown>)
    .__FORMATJS_DATETIMEFORMAT_DATA__ as
    | Parameters<(typeof DateTimeFormat)['__addLocaleData']>[0][]
    | undefined
  if (buf) {
    for (const d of buf) DateTimeFormat.__addLocaleData(d)
    delete (globalThis as Record<string, unknown>)
      .__FORMATJS_DATETIMEFORMAT_DATA__
  }
}
