import {DisplayNames} from '#packages/intl-displaynames/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'DisplayNames', {value: DisplayNames})

// Drain any locale data that was buffered before polyfill loaded
const buf = (globalThis as Record<string, unknown>)
  .__FORMATJS_DISPLAYNAMES_DATA__ as
  | Parameters<(typeof DisplayNames)['__addLocaleData']>[0][]
  | undefined
if (buf) {
  for (const d of buf) DisplayNames.__addLocaleData(d)
  delete (globalThis as Record<string, unknown>).__FORMATJS_DISPLAYNAMES_DATA__
}
