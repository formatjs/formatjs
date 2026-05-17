import {DurationFormat} from '#packages/intl-durationformat/index.js'
import {shouldPolyfill} from '#packages/intl-durationformat/should-polyfill.js'
import {defineProperty, ensureIntl} from '#packages/ecma402-abstract/utils.js'

const intl = ensureIntl()

if (shouldPolyfill()) {
  defineProperty(intl, 'DurationFormat', {value: DurationFormat})
}
