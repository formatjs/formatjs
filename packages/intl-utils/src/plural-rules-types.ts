import {LocaleData} from './types';
export type LDMLPluralRule = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export interface PluralRulesData {
  categories: {
    cardinal: string[];
    ordinal: string[];
  };
  fn: (val: number | string, ord?: boolean) => LDMLPluralRule;
}

export type PluralRulesLocaleData = LocaleData<PluralRulesData>;
