import {shouldPolyfill} from './should-polyfill'
import {supportedValuesOf} from './polyfills'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'supportedValuesOf', {
    value: supportedValuesOf,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}
