import {
  Type,
  invariant,
  PluralRulesInternal,
  LDMLPluralRule,
  FormatNumericToString,
} from '@formatjs/ecma402-abstract'
import {GetOperands, OperandsRecord} from './GetOperands'

/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-resolveplural
 * @param pl
 * @param n
 * @param PluralRuleSelect Has to pass in bc it's implementation-specific
 */
export function ResolvePlural(
  pl: Intl.PluralRules,
  n: number,
  {
    getInternalSlots,
    PluralRuleSelect,
  }: {
    getInternalSlots(pl: Intl.PluralRules): PluralRulesInternal
    PluralRuleSelect: (
      locale: string,
      type: 'cardinal' | 'ordinal',
      n: number,
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
  invariant(Type(n) === 'Number', 'n must be a number')
  if (!isFinite(n)) {
    return 'other'
  }
  const {locale, type} = internalSlots
  const res = FormatNumericToString(internalSlots, n)
  const s = res.formattedString
  const operands = GetOperands(s)
  return PluralRuleSelect(locale, type, n, operands)
}
