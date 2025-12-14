import {PluralRules} from './index.js'
import {shouldPolyfill} from './should-polyfill.js'

if (shouldPolyfill()) {
  Object.defineProperty(Intl, 'PluralRules', {
    value: PluralRules,
    writable: true,
    enumerable: false,
    configurable: true,
  })
}
