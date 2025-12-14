import {Segmenter} from './src/segmenter.js'
import {shouldPolyfill} from './should-polyfill.js'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'Segmenter', {
    value: Segmenter,
    enumerable: false,
    writable: true,
    configurable: true,
  })
}
