import {NumberFormat} from '#packages/intl-numberformat/core.js'
import {toLocaleString as _toLocaleString} from '#packages/intl-numberformat/to_locale_string.js'
import {type NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'
import {defineProperty} from '#packages/ecma402-abstract/utils.js'

defineProperty(Intl, 'NumberFormat', {value: NumberFormat})
defineProperty(Number.prototype, 'toLocaleString', {
  value: function toLocaleString(
    locales?: string | string[],
    options?: NumberFormatOptions
  ) {
    return _toLocaleString(this, locales, options)
  },
})
if (typeof BigInt !== 'undefined') {
  defineProperty(BigInt.prototype, 'toLocaleString', {
    value: function toLocaleString(
      locales?: string | string[],
      options?: NumberFormatOptions
    ) {
      return _toLocaleString(this, locales, options)
    },
  })
}

// Drain any locale data that was buffered before polyfill loaded
const buf = (globalThis as Record<string, unknown>)
  .__FORMATJS_NUMBERFORMAT_DATA__ as
  | Parameters<(typeof NumberFormat)['__addLocaleData']>[0][]
  | undefined
if (buf) {
  for (const d of buf) NumberFormat.__addLocaleData(d)
  delete (globalThis as Record<string, unknown>).__FORMATJS_NUMBERFORMAT_DATA__
}
