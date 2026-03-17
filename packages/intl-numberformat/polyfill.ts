import {NumberFormat} from './src/core.js'
import {toLocaleString as _toLocaleString} from './src/to_locale_string.js'
import {
  defineProperty,
  type NumberFormatOptions,
} from '@formatjs/ecma402-abstract'
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

  // Drain any locale data that was buffered before polyfill loaded
  const buf = (globalThis as Record<string, unknown>)
    .__FORMATJS_NUMBERFORMAT_DATA__ as
    | Parameters<(typeof NumberFormat)['__addLocaleData']>[0][]
    | undefined
  if (buf) {
    for (const d of buf) NumberFormat.__addLocaleData(d)
    delete (globalThis as Record<string, unknown>)
      .__FORMATJS_NUMBERFORMAT_DATA__
  }
}
