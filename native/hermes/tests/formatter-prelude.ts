// Real TS formatters supply the partially migrated runtime's capabilities.
// This fixture disappears as the corresponding native formatters are ported.
import '@formatjs/intl-locale/polyfill-force.js'
import '@formatjs/intl-pluralrules/polyfill-force.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import '@formatjs/intl-numberformat/polyfill-force.js'
import '@formatjs/intl-numberformat/locale-data/en.js'
import '@formatjs/intl-datetimeformat/polyfill-force.js'
import '@formatjs/intl-datetimeformat/locale-data/en.js'
import '@formatjs/intl-collator/polyfill-force.js'

;(globalThis as any).__trustedLocale = Intl.Locale
