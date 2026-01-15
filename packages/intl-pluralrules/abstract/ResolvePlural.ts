import {
  FormatNumericToString,
  invariant,
  type LDMLPluralRule,
  type PluralRulesInternal,
  Type,
} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'
import {GetOperands, type OperandsRecord} from './GetOperands.js'

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

  const {locale, type} = internalSlots

  // Format the number according to digit options (minimumFractionDigits, etc.)
  const res = FormatNumericToString(internalSlots, n)
  const s = res.formattedString

  // Extract CLDR operands (n, i, v, w, f, t, c, e) from the formatted string
  const operands = GetOperands(s)

  // Select the appropriate plural category using the locale's plural rules
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
