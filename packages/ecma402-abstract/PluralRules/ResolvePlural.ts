import type {IntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import {numberFrom} from '#packages/ecma262-abstract/intrinsics.js'
import {Type} from '#packages/ecma262-abstract/Type.js'
import {FormatNumericToString} from '#packages/ecma402-abstract/NumberFormat/FormatNumericToString.js'
import {
  type LDMLPluralRule,
  type PluralRulesData,
  type PluralRulesInternal,
} from '#packages/ecma402-abstract/types/plural-rules.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import type Decimal from '@formatjs/bigdecimal'

const objectKeys = Object.keys

/**
 * Result of ResolvePluralInternal containing both the formatted string and plural category.
 * This corresponds to a Record with [[FormattedString]] and [[PluralCategory]] fields
 * as described in the ECMA-402 spec for ResolvePluralRange.
 */
export interface ResolvePluralResult {
  /** The formatted representation of the number */
  formattedString: string
  /** The LDML plural category (zero, one, two, few, many, or other) */
  pluralCategory: LDMLPluralRule
}

/**
 * ResolvePluralInternal ( pluralRules, n )
 *
 * Internal version of ResolvePlural that returns both the formatted string and plural category.
 * This is needed for selectRange, which must compare formatted strings to determine if the
 * start and end values are identical.
 *
 * The formatted string is obtained by applying the number formatting options (digit options)
 * from the PluralRules object to the input number. This ensures that formatting-sensitive
 * plural rules work correctly (e.g., rules that depend on visible fraction digits).
 *
 * @param pl - An initialized PluralRules object
 * @param n - Mathematical value to resolve
 * @returns Record containing the formatted string and plural category
 */
export function ResolvePluralInternal(
  pl: Intl.PluralRules,
  n: Decimal | IntlMathematicalValue,
  {
    getInternalSlots,
    PluralRuleSelect,
  }: {
    getInternalSlots(pl: Intl.PluralRules): PluralRulesInternal
    PluralRuleSelect: (
      localeData: PluralRulesData | undefined,
      type: 'cardinal' | 'ordinal',
      decimalString: string,
      exponent: number
    ) => LDMLPluralRule
  }
): ResolvePluralResult {
  const record = 'value' in n ? n : undefined
  n = 'value' in n ? n.value : n
  const internalSlots = getInternalSlots(pl)
  invariant(Type(internalSlots) === 'Object', 'pl has to be an object')
  invariant(
    'initializedPluralRules' in internalSlots,
    'pluralrules must be initialized'
  )

  // ECMA-402 §17.5.2 steps 1–3 distinguish NaN and the signs of infinity.
  // https://tc39.es/ecma402/#sec-resolveplural
  if (!n.isFinite()) {
    return {
      formattedString: n.isNaN()
        ? 'NaN'
        : n.isNegative()
          ? '-Infinity'
          : 'Infinity',
      pluralCategory: 'other',
    }
  }

  const {localeData, type, notation} = internalSlots

  // ECMA-402 §17.5.2 steps 4–5 round with the instance's digit options.
  const res = FormatNumericToString(
    internalSlots,
    n,
    record?.stringDigitCount || 0,
    record?.stringFractionDigitCount || 0
  )
  const s = res.formattedString

  // ECMA-402 §17.5.2, step 10 selects from the rounded decimal string.
  // Own CLDR data keeps compact selection independent of NumberFormat.
  // https://tc39.es/ecma402/#sec-resolveplural
  let exponent = 0
  if (notation === 'compact') {
    const patterns =
      internalSlots.compactExponents?.[internalSlots.compactDisplay || 'short']
    if (patterns) {
      let first = 0
      while (first < s.length && s[first] === '0') first++
      let end = first
      while (end < s.length && s[end] !== '.') end++
      const magnitude = end - first - 1
      let selectedMagnitude = -1
      // The compact table contains private data fields for non-negative magnitudes.
      const keys = objectKeys(patterns)
      for (let i = 0; i < keys.length; i++) {
        const threshold = numberFrom(keys[i])
        if (threshold <= magnitude && threshold > selectedMagnitude) {
          selectedMagnitude = threshold
          exponent = patterns[threshold]
        }
      }
    }
  }

  // ECMA-402 Spec: Select the appropriate plural category using the locale's plural rules
  const pluralCategory = PluralRuleSelect(localeData, type, s, exponent)

  return {formattedString: s, pluralCategory}
}

/**
 * https://tc39.es/ecma402/#sec-resolveplural
 * @param pl
 * @param n
 * @param PluralRuleSelect Has to pass in bc it's implementation-specific
 */
export function ResolvePlural(
  pl: Intl.PluralRules,
  n: Decimal | IntlMathematicalValue,
  {
    getInternalSlots,
    PluralRuleSelect,
  }: {
    getInternalSlots(pl: Intl.PluralRules): PluralRulesInternal
    PluralRuleSelect: (
      localeData: PluralRulesData | undefined,
      type: 'cardinal' | 'ordinal',
      decimalString: string,
      exponent: number
    ) => LDMLPluralRule
  }
): LDMLPluralRule {
  return ResolvePluralInternal(pl, n, {getInternalSlots, PluralRuleSelect})
    .pluralCategory
}
