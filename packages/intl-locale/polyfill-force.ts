import {Locale} from '#packages/intl-locale/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'Locale', {value: Locale})
