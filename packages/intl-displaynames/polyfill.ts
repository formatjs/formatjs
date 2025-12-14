import {DisplayNames} from './index.js'
import {shouldPolyfill} from './should-polyfill.js'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'DisplayNames', {
    value: DisplayNames,
    enumerable: false,
    writable: true,
    configurable: true,
  })
}
