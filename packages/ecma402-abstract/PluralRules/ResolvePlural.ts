import {Type} from '#packages/ecma262-abstract/Type.js'
import {FormatNumericToString} from '#packages/ecma402-abstract/NumberFormat/FormatNumericToString.js'
import {
  type LDMLPluralRule,
  type PluralRulesInternal,
} from '#packages/ecma402-abstract/types/plural-rules.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import type Decimal from '@formatjs/bigdecimal'
import {
  GetOperands,
  type OperandsRecord,
} from '#packages/ecma402-abstract/PluralRules/GetOperands.js'

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
  n: Decimal,
  {
    getInternalSlots,
    PluralRuleSelect,
  }: {
    getInternalSlots(pl: Intl.PluralRules): PluralRulesInternal
    PluralRuleSelect: (
      locale: string,
      type: 'cardinal' | 'ordinal',
      n: Decimal,
      operands: OperandsRecord
    ) => LDMLPluralRule
  }
): ResolvePluralResult {
  const internalSlots = getInternalSlots(pl)
  invariant(Type(internalSlots) === 'Object', 'pl has to be an object')
  invariant(
    'initializedPluralRules' in internalSlots,
    'pluralrules must be initialized'
  )

  // Handle non-finite values (Infinity, -Infinity, NaN)
  if (!n.isFinite()) {
    return {formattedString: String(n), pluralCategory: 'other'}
  }

  const {locale, type, notation} = internalSlots

  // ECMA-402 Spec: Format the number according to digit options
  const res = FormatNumericToString(internalSlots, n)
  const s = res.formattedString

  // ECMA-402 §17.5.2, step 10 selects from the rounded decimal string.
  // Own CLDR data keeps compact selection independent of NumberFormat.
  // https://tc39.es/ecma402/#sec-resolveplural
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L316-L321
  let exponent = 0
  if (notation === 'compact') {
    const patterns =
      internalSlots.compactExponents?.[internalSlots.compactDisplay || 'short']
    const unsigned = s[0] === '-' ? s.slice(1) : s
    const integer = unsigned.split('.')[0]
    let first = 0
    while (first < integer.length && integer[first] === '0') first++
    const magnitude = integer.length - first - 1
    let selectedMagnitude = -1
    if (patterns) {
      for (const key in patterns) {
        const threshold = Number(key)
        if (threshold <= magnitude && threshold > selectedMagnitude) {
          selectedMagnitude = threshold
          exponent = patterns[threshold]
        }
      }
    }
  }

  const operands = GetOperands(s, exponent)

  // ECMA-402 Spec: Select the appropriate plural category using the locale's plural rules
  const pluralCategory = PluralRuleSelect(locale, type, n, operands)

  return {formattedString: s, pluralCategory}
}

/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-resolveplural
 * @param pl
 * @param n
 * @param PluralRuleSelect Has to pass in bc it's implementation-specific
 */
export function ResolvePlural(
  pl: Intl.PluralRules,
  n: Decimal,
  {
    getInternalSlots,
    PluralRuleSelect,
  }: {
    getInternalSlots(pl: Intl.PluralRules): PluralRulesInternal
    PluralRuleSelect: (
      locale: string,
      type: 'cardinal' | 'ordinal',
      n: Decimal,
      operands: OperandsRecord
    ) => LDMLPluralRule
  }
): LDMLPluralRule {
  return ResolvePluralInternal(pl, n, {getInternalSlots, PluralRuleSelect})
    .pluralCategory
}
