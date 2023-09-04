import {Segmenter} from './src/segmenter'
import {shouldPolyfill} from './should-polyfill'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'Segmenter', {
    value: Segmenter,
    enumerable: false,
    writable: true,
    configurable: true,
  })
}
