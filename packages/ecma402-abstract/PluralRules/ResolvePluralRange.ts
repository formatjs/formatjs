import {Type} from '#packages/ecma262-abstract/Type.js'
import {
  type LDMLPluralRule,
  type PluralRulesInternal,
} from '#packages/ecma402-abstract/types/plural-rules.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import type Decimal from '@formatjs/bigdecimal'
import {type OperandsRecord} from '#packages/ecma402-abstract/PluralRules/GetOperands.js'
import {ResolvePluralInternal} from '#packages/ecma402-abstract/PluralRules/ResolvePlural.js'

/**
 * ResolvePluralRange ( pluralRules, x, y )
 *
 * The ResolvePluralRange abstract operation is called with arguments pluralRules (which must be
 * an object initialized as a PluralRules), x (a mathematical value), and y (a mathematical value).
 * It resolves the appropriate plural form for a range by determining the plural forms of both the
 * start and end values, then consulting locale-specific range data.
 *
 * ECMA-402 §17.5.4 ResolvePluralRange, steps 1–3.
 * Specification: https://tc39.es/ecma402/#sec-resolvepluralrange
 * https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L356-L358
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
  // ResolvePluralRange rejects NaN but permits either infinity.
  // ECMA-402 §17.5.4 ResolvePluralRange, steps 1–3.
  // https://tc39.es/ecma402/#sec-resolvepluralrange
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L356-L358
  if (x.isNaN() || y.isNaN()) {
    throw new RangeError(
      'selectRange requires start and end values not to be NaN'
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
