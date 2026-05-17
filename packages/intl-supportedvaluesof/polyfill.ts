import {shouldPolyfill} from '#packages/intl-supportedvaluesof/should-polyfill.js'
import {supportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

if (shouldPolyfill()) {
  defineProperty(intl, 'supportedValuesOf', {value: supportedValuesOf})
}
