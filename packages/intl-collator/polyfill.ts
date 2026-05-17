import {Collator} from '#packages/intl-collator/index.js'
import {shouldPolyfill} from '#packages/intl-collator/should-polyfill.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

if (shouldPolyfill()) {
  defineProperty(intl, 'Collator', {value: Collator})
}
