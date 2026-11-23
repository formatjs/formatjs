import {DurationFormat} from '#packages/intl-durationformat/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

// ECMA-402 §8.2.4 and §13.1 install Intl.DurationFormat.
// https://tc39.es/ecma402/#sec-intl-durationformat-constructor
// https://tc39.es/ecma402/#sec-intl.durationformat-intro
defineProperty(intl, 'DurationFormat', {value: DurationFormat})
