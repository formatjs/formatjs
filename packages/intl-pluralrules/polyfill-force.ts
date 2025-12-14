import {PluralRules} from './index.js'

Object.defineProperty(Intl, 'PluralRules', {
  value: PluralRules,
  writable: true,
  enumerable: false,
  configurable: true,
})
