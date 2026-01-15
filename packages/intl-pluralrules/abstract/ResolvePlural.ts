import {
  ComputeExponentForMagnitude,
  FormatNumericToString,
  invariant,
  type LDMLPluralRule,
  type PluralRulesInternal,
  Type,
} from '@formatjs/ecma402-abstract'
import Decimal from 'decimal.js'
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

  const {locale, type, notation} = internalSlots

  // ECMA-402 Spec: Format the number according to digit options
  const res = FormatNumericToString(internalSlots, n)
  const s = res.formattedString

  // Extension: Calculate compact exponent if using compact notation
  // This enables CLDR c/e operands for proper plural selection with compact numbers
  let exponent = 0
  if (notation === 'compact' && !n.isZero()) {
    // Implementation: Only calculate exponent if NumberFormat locale data is available (soft dependency)
    if (internalSlots.dataLocaleData?.numbers) {
      try {
        // Calculate magnitude (floor of log10 of absolute value)
        const magnitudeNum = Math.floor(Math.log10(Math.abs(n.toNumber())))
        const magnitude = new Decimal(magnitudeNum)
        // Use ComputeExponentForMagnitude from ecma402-abstract
        // This determines which compact notation pattern to use (K, M, B, etc.)
        // Cast to any since it expects NumberFormatInternal
        exponent = ComputeExponentForMagnitude(internalSlots as any, magnitude)
      } catch {
        // Gracefully fall back to 0 if exponent calculation fails
        exponent = 0
      }
    }
    // Otherwise, exponent remains 0 (standard behavior without NumberFormat data)
  }

  // ECMA-402 Spec: Extract CLDR operands from the formatted string
  // Extension: Pass exponent for c/e operands
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
