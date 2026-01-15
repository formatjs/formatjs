import {
  invariant,
  type LDMLPluralRule,
  type PluralRulesInternal,
  Type,
} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'
import {type OperandsRecord} from './GetOperands.js'
import {ResolvePluralInternal} from './ResolvePlural.js'

/**
 * ResolvePluralRange ( pluralRules, x, y )
 *
 * The ResolvePluralRange abstract operation is called with arguments pluralRules (which must be
 * an object initialized as a PluralRules), x (a mathematical value), and y (a mathematical value).
 * It resolves the appropriate plural form for a range by determining the plural forms of both the
 * start and end values, then consulting locale-specific range data.
 *
 * Specification: https://tc39.es/ecma402/#sec-resolvepluralrange
 *
 * @param pluralRules - An initialized PluralRules object
 * @param x - Mathematical value for the range start
 * @param y - Mathematical value for the range end
 * @returns The plural category for the range (zero, one, two, few, many, or other)
 */
export function ResolvePluralRange(
  pluralRules: Intl.PluralRules,
  x: Decimal,
  y: Decimal,
  {
    getInternalSlots,
    PluralRuleSelect,
    PluralRuleSelectRange,
  }: {
    getInternalSlots(pl: Intl.PluralRules): PluralRulesInternal
    PluralRuleSelect: (
      locale: string,
      type: 'cardinal' | 'ordinal',
      n: Decimal,
      operands: OperandsRecord
    ) => LDMLPluralRule
    PluralRuleSelectRange: (
      locale: string,
      type: 'cardinal' | 'ordinal',
      xp: LDMLPluralRule,
      yp: LDMLPluralRule
    ) => LDMLPluralRule
  }
): LDMLPluralRule {
  // 1. If x is not-a-number or y is not-a-number, throw a RangeError exception.
  if (!x.isFinite() || !y.isFinite()) {
    throw new RangeError(
      'selectRange requires start and end values to be finite numbers'
    )
  }

  // Validation: Assert that pluralRules has been initialized
  const internalSlots = getInternalSlots(pluralRules)
  invariant(Type(internalSlots) === 'Object', 'pluralRules has to be an object')
  invariant(
    'initializedPluralRules' in internalSlots,
    'pluralrules must be initialized'
  )

  // 2. Let xp be ResolvePlural(pluralRules, x).
  // Note: ResolvePlural returns a Record with [[FormattedString]] and [[PluralCategory]]
  const xp = ResolvePluralInternal(pluralRules, x, {
    getInternalSlots,
    PluralRuleSelect,
  })

  // 3. Let yp be ResolvePlural(pluralRules, y).
  const yp = ResolvePluralInternal(pluralRules, y, {
    getInternalSlots,
    PluralRuleSelect,
  })

  // 4. If xp.[[FormattedString]] is yp.[[FormattedString]], then
  //    a. Return xp.[[PluralCategory]].
  // Note: When the formatted strings are identical (e.g., "1" and "1"), the values are
  // effectively the same, so we return the plural category of the start value.
  if (xp.formattedString === yp.formattedString) {
    return xp.pluralCategory
  }

  // 5. Let locale be pluralRules.[[Locale]].
  // 6. Let type be pluralRules.[[Type]].
  const {locale, type} = internalSlots

  // 7. Let notation be pluralRules.[[Notation]].
  // 8. Let compactDisplay be pluralRules.[[CompactDisplay]].
  // Note: notation and compactDisplay are not yet implemented for PluralRules polyfill.
  // When implemented, these would affect how the range is formatted and thus which
  // plural rules apply (see c/e operand support).

  // 9. Return PluralRuleSelectRange(locale, type, notation, compactDisplay, xp.[[PluralCategory]], yp.[[PluralCategory]]).
  // Note: PluralRuleSelectRange is implementation-defined and uses CLDR plural range data
  // to determine the appropriate plural category for a range based on the start and end categories.
  // Example: In English, "one" to "other" → "other" (e.g., "1-2 items")
  return PluralRuleSelectRange(
    locale,
    type,
    xp.pluralCategory,
    yp.pluralCategory
  )
}
