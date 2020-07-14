import {LDMLPluralRuleMap} from '@formatjs/intl-utils';
import {isEqual} from 'lodash';
export function collapseSingleValuePluralRule<T>(
  rules: LDMLPluralRuleMap<T>
): LDMLPluralRuleMap<T> {
  const keys = Object.keys(rules) as Array<Intl.LDMLPluralRule>;
  return keys.reduce(
    (all: LDMLPluralRuleMap<T>, k) => {
      if (k !== 'other' && rules[k] && !isEqual(rules[k], rules.other)) {
        all[k] = rules[k];
      }
      return all;
    },
    {other: rules.other}
  );
}

export const PLURAL_RULES: Array<Intl.LDMLPluralRule> = [
  'other',
  'zero',
  'one',
  'two',
  'few',
  'many',
];
