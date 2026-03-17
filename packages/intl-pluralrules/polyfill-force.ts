import {PluralRules} from './index.js'

Object.defineProperty(Intl, 'PluralRules', {
  value: PluralRules,
  writable: true,
  enumerable: false,
  configurable: true,
})

// Drain any locale data that was buffered before polyfill loaded
const buf = (globalThis as Record<string, unknown>)
  .__FORMATJS_PLURALRULES_DATA__ as
  | Parameters<(typeof PluralRules)['__addLocaleData']>[0][]
  | undefined
if (buf) {
  for (const d of buf) PluralRules.__addLocaleData(d)
  delete (globalThis as Record<string, unknown>).__FORMATJS_PLURALRULES_DATA__
}
