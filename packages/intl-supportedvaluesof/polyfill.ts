import {shouldPolyfill} from '#packages/intl-supportedvaluesof/should-polyfill.js'
import {supportedValuesOf} from './src'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'supportedValuesOf', {
    value: supportedValuesOf,
    enumerable: true,
    writable: false,
    configurable: false,
  })
}
