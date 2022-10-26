import DurationFormat from './'
import {shouldPolyfill} from './should-polyfill'
if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'DurationFormat', {
    value: DurationFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  })
}
