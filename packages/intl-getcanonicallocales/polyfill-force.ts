import {getCanonicalLocales} from '#packages/intl-getcanonicallocales/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'getCanonicalLocales', {value: getCanonicalLocales})
