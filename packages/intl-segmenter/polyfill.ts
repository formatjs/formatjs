import {Segmenter} from '#packages/intl-segmenter/segmenter.js'
import {shouldPolyfill} from '#packages/intl-segmenter/should-polyfill.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

if (shouldPolyfill()) {
  defineProperty(intl, 'Segmenter', {value: Segmenter})
}
