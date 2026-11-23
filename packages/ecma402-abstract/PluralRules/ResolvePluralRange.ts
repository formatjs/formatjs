import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import type {IntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import {Type} from '#packages/ecma262-abstract/Type.js'
import {
  type LDMLPluralRule,
  type PluralRulesData,
  type PluralRulesInternal,
} from '#packages/ecma402-abstract/types/plural-rules.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import type Decimal from '@formatjs/bigdecimal'
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
 *
 * @param pluralRules - An initialized PluralRules object
 * @param x - Mathematical value for the range start
 * @param y - Mathematical value for the range end
 * @returns The plural category for the range (zero, one, two, few, many, or other)
 */
export function ResolvePluralRange(
  pluralRules: Intl.PluralRules,
  x: Decimal | IntlMathematicalValue,
  y: Decimal | IntlMathematicalValue,
  {
    getInternalSlots,
    PluralRuleSelect,
    PluralRuleSelectRange,
  }: {
    getInternalSlots(pl: Intl.PluralRules): PluralRulesInternal
    PluralRuleSelect: (
      localeData: PluralRulesData | undefined,
      type: 'cardinal' | 'ordinal',
      decimalString: string,
      exponent: number
    ) => LDMLPluralRule
    PluralRuleSelectRange: (
      localeData: PluralRulesData | undefined,
      type: 'cardinal' | 'ordinal',
      xp: LDMLPluralRule,
      yp: LDMLPluralRule
    ) => LDMLPluralRule
  }
): LDMLPluralRule {
  // ResolvePluralRange rejects NaN but permits either infinity.
  // ECMA-402 §17.5.4 ResolvePluralRange, steps 1–3.
  // https://tc39.es/ecma402/#sec-resolvepluralrange
  if (
    ('value' in x ? x.value : x).isNaN() ||
    ('value' in y ? y.value : y).isNaN()
  ) {
    throw new RangeErrorConstructor(
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

  const {localeData, type} = internalSlots

  // ECMA-402 §17.5.4 steps 7–9 apply the range rule to the selected categories.
  // CLDR selects by category pair. Notation and compactDisplay affect the endpoint categories.
  // https://tc39.es/ecma402/#sec-resolvepluralrange
  return PluralRuleSelectRange(
    localeData,
    type,
    xp.pluralCategory,
    yp.pluralCategory
  )
}
