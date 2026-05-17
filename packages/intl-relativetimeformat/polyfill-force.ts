import RelativeTimeFormat from '#packages/intl-relativetimeformat/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'RelativeTimeFormat', {value: RelativeTimeFormat})

// Drain any locale data that was buffered before polyfill loaded
const buf = (globalThis as Record<string, unknown>)
  .__FORMATJS_RELATIVETIMEFORMAT_DATA__ as
  | Parameters<(typeof RelativeTimeFormat)['__addLocaleData']>[0][]
  | undefined
if (buf) {
  for (const d of buf) RelativeTimeFormat.__addLocaleData(d)
  delete (globalThis as Record<string, unknown>)
    .__FORMATJS_RELATIVETIMEFORMAT_DATA__
}
