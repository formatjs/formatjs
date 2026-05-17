import {DurationFormat} from '#packages/intl-durationformat/index.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

defineProperty(intl, 'DurationFormat', {value: DurationFormat})
