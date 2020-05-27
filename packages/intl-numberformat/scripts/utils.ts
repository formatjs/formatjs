import {LDMLPluralRuleMap, LDMLPluralRule} from '@formatjs/intl-utils';
import {isEqual} from 'lodash';
export function collapseSingleValuePluralRule<T>(
  rules: LDMLPluralRuleMap<T>
): LDMLPluralRuleMap<T> {
  const keys = Object.keys(rules) as Array<LDMLPluralRule>;
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
