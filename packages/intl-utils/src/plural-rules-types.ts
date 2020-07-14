import {LocaleData} from './types';

export interface PluralRulesData {
  categories: {
    cardinal: string[];
    ordinal: string[];
  };
  fn: (val: number | string, ord?: boolean) => Intl.LDMLPluralRule;
}

export type PluralRulesLocaleData = LocaleData<PluralRulesData>;
