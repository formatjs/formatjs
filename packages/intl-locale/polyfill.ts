import {Locale} from './index.js'
import {shouldPolyfill} from './should-polyfill.js'
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'Locale', {
    value: Locale,
    writable: true,
    enumerable: false,
    configurable: true,
  })
}
