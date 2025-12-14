import ListFormat from './index.js'
import {shouldPolyfill} from './should-polyfill.js'
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'ListFormat', {
    value: ListFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  })
}
