import {type LDMLPluralRuleMap} from '#packages/ecma402-abstract/types/number.js'
import {type LDMLPluralRule} from '#packages/ecma402-abstract/types/plural-rules.js'
import {isEqual} from 'lodash-es'
export function collapseSingleValuePluralRule<T>(
  rules: LDMLPluralRuleMap<T>
): LDMLPluralRuleMap<T> {
  const keys = Object.keys(rules) as Array<LDMLPluralRule>
  return keys.reduce(
    (all: LDMLPluralRuleMap<T>, k) => {
      if (k !== 'other' && rules[k] && !isEqual(rules[k], rules.other)) {
        all[k] = rules[k]
      }
      return all
    },
    {other: rules.other}
  )
}

export const PLURAL_RULES: Array<LDMLPluralRule> = [
  'other',
  'zero',
  'one',
  'two',
  'few',
  'many',
]
