import {Collator} from '#packages/intl-collator/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

// ECMA-402 §8.2.1 and §10.1 install Intl.Collator.
// https://tc39.es/ecma402/#sec-intl-collator-constructor
// https://tc39.es/ecma402/#sec-intl.collator-intro
defineProperty(intl, 'Collator', {value: Collator})
