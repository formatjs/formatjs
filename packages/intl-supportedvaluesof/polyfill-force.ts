import {supportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'supportedValuesOf', {value: supportedValuesOf})
