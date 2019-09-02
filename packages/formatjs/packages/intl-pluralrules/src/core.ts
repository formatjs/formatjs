import {
  resolveSupportedLocales,
  toObject,
  getOption,
} from '@formatjs/intl-utils';

const DEFAULT_LOCALE = new Intl.NumberFormat().resolvedOptions().locale;

function validateInstance(instance: any, method: string) {
  if (!(instance instanceof PluralRules)) {
    throw new TypeError(
      `Method Intl.PluralRules.prototype.${method} called on incompatible receiver ${String(
        instance
      )}`
    );
  }
}

export class PluralRules implements Intl.PluralRules {
  private readonly _locale: string;
  private readonly _type: 'cardinal' | 'ordinal' = 'cardinal';
  private readonly _localeMatcher: Intl.PluralRulesOptions['localeMatcher'];
  private pluralRuleData: PluralRulesData;
  constructor(locales?: string | string[], options?: Intl.PluralRulesOptions) {
    const opts =
      options === undefined ? Object.create(null) : toObject(options);
    if (locales === undefined) {
      this._locale = DEFAULT_LOCALE;
    } else {
      const resolvedLocales = resolveSupportedLocales(
        [...(Array.isArray(locales) ? locales : [locales]), DEFAULT_LOCALE],
        PluralRules.__localeData__
      );
      if (resolvedLocales.length < 1) {
        throw new Error(
          'No locale data has been added to IntlPluralRules for: ' +
            resolvedLocales.join(', ') +
            ', or the default locale: ' +
            DEFAULT_LOCALE
        );
      }
      this._locale = resolvedLocales[0];
    }
    this._type = getOption(
      opts,
      'type',
      'string',
      ['cardinal', 'ordinal'],
      'cardinal'
    );
    this._localeMatcher = getOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    );
    this.pluralRuleData = PluralRules.__localeData__[this._locale];
  }
  public resolvedOptions() {
    validateInstance(this, 'resolvedOptions');
    const opts = Object.create(Object.prototype);
    Object.defineProperties(opts, {
      locale: {
        value: this._locale,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      type: {
        value: (this._type as String).valueOf(),
        writable: true,
        enumerable: true,
        configurable: true,
      },
      minimumIntegerDigits: {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      minimumSignificantDigits: {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      maximumSignificantDigits: {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      minimumFractionDigits: {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      maximumFractionDigits: {
        value: 0,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      pluralCategories: {
        value: this.pluralRuleData.categories[this._type],
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });
    return opts;
  }
  public select(val: number): PluralRule {
    validateInstance(this, 'select');
    return this.pluralRuleData.fn(Math.abs(val), this._type === 'ordinal');
  }
  toString() {
    return '[object Intl.PluralRules]';
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
