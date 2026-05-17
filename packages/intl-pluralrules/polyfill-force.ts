import {PluralRules} from '#packages/intl-pluralrules/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'PluralRules', {value: PluralRules})

// Drain any locale data that was buffered before polyfill loaded
const buf = (globalThis as Record<string, unknown>)
  .__FORMATJS_PLURALRULES_DATA__ as
  | Parameters<(typeof PluralRules)['__addLocaleData']>[0][]
  | undefined
if (buf) {
  for (const d of buf) PluralRules.__addLocaleData(d)
  delete (globalThis as Record<string, unknown>).__FORMATJS_PLURALRULES_DATA__
}
