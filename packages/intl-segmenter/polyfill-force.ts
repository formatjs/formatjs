import {Segmenter} from '#packages/intl-segmenter/segmenter.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'Segmenter', {value: Segmenter})
