import {shouldPolyfill} from '#packages/intl-supportedvaluesof/should-polyfill.js'
import {supportedValuesOf} from '#packages/intl-supportedvaluesof/index.js'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'supportedValuesOf', {
    value: supportedValuesOf,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}
