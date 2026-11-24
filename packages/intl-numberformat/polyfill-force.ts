import {NumberFormat} from '#packages/intl-numberformat/core.js'
import {installNumberLocaleMethods} from '#packages/intl-numberformat/to_locale_string.js'
import {
  defineProperty,
  ensureIntl,
  registerFormatterIntrinsic,
} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

// ECMA-402 §8.2.7 installs Intl.NumberFormat.
// https://tc39.es/ecma402/#sec-intl.numberformat-intro
defineProperty(intl, 'NumberFormat', {value: NumberFormat})
registerFormatterIntrinsic(intl, 'NumberFormat', NumberFormat)
installNumberLocaleMethods()

// Drain any locale data that was buffered before polyfill loaded
const buf = (globalThis as Record<string, unknown>)
  .__FORMATJS_NUMBERFORMAT_DATA__ as
  | Parameters<(typeof NumberFormat)['__addLocaleData']>[0][]
  | undefined
if (buf) {
  for (const d of buf) NumberFormat.__addLocaleData(d)
  delete (globalThis as Record<string, unknown>).__FORMATJS_NUMBERFORMAT_DATA__
}
