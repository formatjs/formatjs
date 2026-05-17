import {Locale} from '#packages/intl-locale/index.js'
import {shouldPolyfill} from '#packages/intl-locale/should-polyfill.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

if (shouldPolyfill()) {
  defineProperty(intl, 'Locale', {value: Locale})
}
