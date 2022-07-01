export type {SupportedValuesOf} from './polyfills'
export type {Calendar} from './data/calendars'
export type {Collation} from './data/collations'
export type {Currency} from './data/currencies'
export type {NumberingSystem} from './data/numbering-systems'
export type {Timezone} from './data/timezones'
export type {Unit} from './data/units'

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
