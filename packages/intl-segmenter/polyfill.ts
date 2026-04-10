import {Segmenter} from '#packages/intl-segmenter/src/segmenter.js'
import {shouldPolyfill} from '#packages/intl-segmenter/should-polyfill.js'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'Segmenter', {
    value: Segmenter,
    enumerable: false,
    writable: true,
    configurable: true,
  })
}
