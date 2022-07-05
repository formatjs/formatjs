import {supportedValuesOf} from './polyfills/index'

Object.defineProperty(Intl, 'supportedValuesOf', {
  value: supportedValuesOf,
  enumerable: true,
  writable: false,
  configurable: false,
})
