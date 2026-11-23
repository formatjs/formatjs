import {Segmenter} from '#packages/intl-segmenter/segmenter.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

// ECMA-402 §8.2.10 and §19.1 install Intl.Segmenter.
// https://tc39.es/ecma402/#sec-intl-segmenter-constructor
// https://tc39.es/ecma402/#sec-intl.segmenter-intro
defineProperty(intl, 'Segmenter', {value: Segmenter})
