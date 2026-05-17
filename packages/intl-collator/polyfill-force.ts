import {Collator} from '#packages/intl-collator/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'Collator', {value: Collator})
