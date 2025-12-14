import RelativeTimeFormat from './index.js'
import {shouldPolyfill} from './should-polyfill.js'
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'RelativeTimeFormat', {
    value: RelativeTimeFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  })
}
