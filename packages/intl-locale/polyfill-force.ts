import {registerLocaleBrand} from '#packages/intl-locale/locale-brand.js'
import {Locale} from '#packages/intl-locale/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

// ECMA-402 §8.2.6 and §15.1 install Intl.Locale.
// https://tc39.es/ecma402/#sec-intl-locale-constructor
// https://tc39.es/ecma402/#sec-intl.locale-intro
defineProperty(intl, 'Locale', {value: Locale})
registerLocaleBrand(Locale, intl)
