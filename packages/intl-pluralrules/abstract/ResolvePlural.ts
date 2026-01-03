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
  const internalSlots = getInternalSlots(pl)
  invariant(Type(internalSlots) === 'Object', 'pl has to be an object')
  invariant(
    'initializedPluralRules' in internalSlots,
    'pluralrules must be initialized'
  )
  if (!n.isFinite()) {
    return 'other'
  }
  const {locale, type} = internalSlots
  const res = FormatNumericToString(internalSlots, n)
  const s = res.formattedString
  const operands = GetOperands(s)
  return PluralRuleSelect(locale, type, n, operands)
}
