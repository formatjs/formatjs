import ListFormat from '#packages/intl-listformat/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

// ECMA-402 §8.2.5 and §14.1 install Intl.ListFormat.
// https://tc39.es/ecma402/#sec-intl-listformat-constructor
// https://tc39.es/ecma402/#sec-intl.listformat-intro
defineProperty(intl, 'ListFormat', {value: ListFormat})

// Drain any locale data that was buffered before polyfill loaded
const buf = (globalThis as Record<string, unknown>)
  .__FORMATJS_LISTFORMAT_DATA__ as
  | Parameters<(typeof ListFormat)['__addLocaleData']>[0][]
  | undefined
if (buf) {
  for (const d of buf) ListFormat.__addLocaleData(d)
  delete (globalThis as Record<string, unknown>).__FORMATJS_LISTFORMAT_DATA__
}
