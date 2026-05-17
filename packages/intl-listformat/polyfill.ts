import ListFormat from '#packages/intl-listformat/index.js'
import {shouldPolyfill} from '#packages/intl-listformat/should-polyfill.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

if (shouldPolyfill()) {
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
}
