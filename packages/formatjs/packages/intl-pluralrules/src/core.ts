import {
  resolveSupportedLocales,
  toObject,
  getOption,
} from '@formatjs/intl-utils';

const DEFAULT_LOCALE = 'en';

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
  private readonly _type: Intl.PluralRulesOptions['type'] = 'cardinal';
  private readonly _opts: Intl.PluralRulesOptions;
  private readonly _localeMatcher: Intl.PluralRulesOptions['localeMatcher'];
  private pluralRuleData: PluralRulesData;
  constructor(locales?: string | string[], options?: Intl.PluralRulesOptions) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof PluralRules ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.PluralRules must be called with 'new'");
    }
    this._opts =
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
      this._opts,
      'type',
      'string',
      ['cardinal', 'ordinal'],
      'cardinal'
    );
    this._localeMatcher = getOption(
      this._opts,
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
    });
    if (
      !('minimumSignificantDigits' in this._opts) &&
      !('maximumSignificantDigits' in this._opts)
    ) {
      Object.defineProperties(opts, {
        minimumIntegerDigits: {
          value: (this._opts as any).minimumIntegerDigits || 1,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        minimumFractionDigits: {
          value: (this._opts as any).minimumFractionDigits || 0,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        maximumFractionDigits: {
          value: (this._opts as any).maximumFractionDigits || 3,
          writable: true,
          enumerable: true,
          configurable: true,
        },
      });
    } else {
      Object.defineProperties(opts, {
        minimumSignificantDigits: {
          value: (this._opts as any).minimumSignificantDigits,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        maximumSignificantDigits: {
          value: (this._opts as any).maximumSignificantDigits,
          writable: true,
          enumerable: true,
          configurable: true,
        },
      });
    }

    Object.defineProperties(opts, {
      pluralCategories: {
        value: [...this.pluralRuleData.categories[this._type!]],
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });
    return opts;
  }
  public select(val: number): PluralRule {
    validateInstance(this, 'select');
    return this.pluralRuleData.fn(
      Math.abs(Number(val)),
      this._type === 'ordinal'
    );
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
