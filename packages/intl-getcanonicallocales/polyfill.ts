import {getCanonicalLocales} from '#packages/intl-getcanonicallocales/index.js'
import {shouldPolyfill} from '#packages/intl-getcanonicallocales/should-polyfill.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'
import {registerCanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'

const intl = ensureIntl()

if (shouldPolyfill()) {
  defineProperty(intl, 'getCanonicalLocales', {value: getCanonicalLocales})
  registerCanonicalizeLocaleList(intl, getCanonicalLocales)
}
