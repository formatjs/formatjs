import {Locale} from '#packages/intl-locale/index.js'
import {shouldPolyfill} from '#packages/intl-locale/should-polyfill.js'
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'Locale', {
    value: Locale,
    writable: true,
    enumerable: false,
    configurable: true,
  })
}
