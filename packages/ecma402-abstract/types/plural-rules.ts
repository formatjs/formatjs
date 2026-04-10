import {type LocaleData} from '#packages/ecma402-abstract/types/core.js'
import {type NumberFormatDigitInternalSlots} from '#packages/ecma402-abstract/types/number.js'
export type LDMLPluralRule = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

export interface PluralRangesData {
  cardinal?: Record<string, LDMLPluralRule>
  ordinal?: Record<string, LDMLPluralRule>
}

export interface PluralRulesData {
  categories: {
    cardinal: string[]
    ordinal: string[]
  }
  fn: (val: number | string, ord?: boolean, exponent?: number) => LDMLPluralRule
  pluralRanges?: PluralRangesData
}

export type PluralRulesLocaleData = LocaleData<PluralRulesData>

// Extends built-in PluralRulesOptions with formatjs-specific extensions
export interface PluralRulesOptions extends Intl.PluralRulesOptions {
  notation?: 'standard' | 'compact'
  compactDisplay?: 'short' | 'long'
}

export interface PluralRulesInternal extends NumberFormatDigitInternalSlots {
  initializedPluralRules: boolean
  locale: string
  type: 'cardinal' | 'ordinal'
  notation: 'standard' | 'compact'
  compactDisplay?: 'short' | 'long'
  dataLocaleData?: any // NumberFormatLocaleInternalData from number.ts
}
