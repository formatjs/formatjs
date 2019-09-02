import {resolveSupportedLocales} from '@formatjs/intl-utils';

const DEFAULT_LOCALE = new Intl.NumberFormat().resolvedOptions().locale;

export class PluralRules implements Intl.PluralRules {
  private locale: string;
  private type: 'cardinal' | 'ordinal' = 'cardinal';
  private pluralRuleData: PluralRulesData;
  constructor(locales?: string | string[], options?: Intl.PluralRulesOptions) {
    this.locale = resolveSupportedLocales(
      [...(Array.isArray(locales) ? locales : [locales]), DEFAULT_LOCALE],
      PluralRules.__localeData__
    )[0];
    this.type = (options && options.type) || 'cardinal';
    this.pluralRuleData = PluralRules.__localeData__[this.locale];
  }
  public resolvedOptions() {
    return {
      locale: this.locale,
      type: this.type,
      minimumIntegerDigits: 0,
      minimumSignificantDigits: 0,
      maximumSignificantDigits: 0,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      pluralCategories: this.pluralRuleData.categories[this.type],
    };
  }
  public select(val: number): PluralRule {
    return this.pluralRuleData.fn(Math.abs(val), this.type === 'ordinal');
  }
  public static supportedLocalesOf(locales: string | string[]) {
    return resolveSupportedLocales(locales, PluralRules.__localeData__);
  }
  public static __addLocaleData(data: PluralRulesData) {
    PluralRules.__localeData__[data.locale] = data;
  }
  private static __localeData__: Record<string, PluralRulesData> = {};
  public static polyfilled = true;
}

export type PluralRule = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface PluralRulesData {
  categories: {
    cardinal: string[];
    ordinal: string[];
  };
  locale: string;
  fn: (val: number | string, ord?: boolean) => PluralRule;
}
