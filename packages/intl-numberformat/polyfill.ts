import {NumberFormat} from './src/core.js'
import {toLocaleString as _toLocaleString} from './src/to_locale_string.js'
import {defineProperty, NumberFormatOptions} from '@formatjs/ecma402-abstract'
import {shouldPolyfill} from './should-polyfill.js'

if (shouldPolyfill()) {
  defineProperty(Intl, 'NumberFormat', {value: NumberFormat})
  defineProperty(Number.prototype, 'toLocaleString', {
    value: function toLocaleString(
      locales?: string | string[],
      options?: NumberFormatOptions
    ) {
      return _toLocaleString(this, locales, options)
    },
  })
}
