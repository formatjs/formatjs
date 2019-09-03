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

/**
 * https://tc39.es/ecma402/#sec-defaultnumberoption
 * @param val
 * @param min
 * @param max
 * @param fallback
 */
function defaultNumberOption(
  val: number | undefined,
  min: number,
  max: number,
  fallback: number
) {
  if (val !== undefined) {
    val = Number(val);
    if (isNaN(val) || val < min || val > max) {
      throw new RangeError(`${val} is outside of range [${min}, ${max}]`);
    }
    return Math.floor(val);
  }
  return fallback;
}

/**
 * https://tc39.es/ecma402/#sec-getnumberoption
 * @param options
 * @param property
 * @param min
 * @param max
 * @param fallback
 */

function getNumberOption<T extends string>(
  options: Record<T, number | undefined>,
  property: T,
  min: number,
  max: number,
  fallback: number
) {
  const val = options[property];
  return defaultNumberOption(val, min, max, fallback);
}

/**
 * https://tc39.es/ecma402/#sec-setnfdigitoptions
 * @param pl
 * @param opts
 * @param mnfdDefault
 * @param mxfdDefault
 */
function setNumberFormatDigitOptions(
  pl: PluralRules,
  opts: Intl.PluralRulesOptions,
  mnfdDefault: number,
  mxfdDefault: number
) {
  const mnid = getNumberOption(opts as any, 'minimumIntegerDigits', 1, 21, 1);
  const mnfd = getNumberOption(
    opts as any,
    'minimumFractionDigits',
    0,
    20,
    mnfdDefault
  );
  const mxfdActualDefault = Math.max(mnfd, mxfdDefault);
  const mxfd = getNumberOption(
    opts as any,
    'maximumFractionDigits',
    mnfd,
    20,
    mxfdActualDefault
  );
  let mnsd = (opts as any).minimumSignificantDigits;
  let mxsd = (opts as any).maximumSignificantDigits;
  pl['[[MinimumIntegerDigits]]'] = mnid;
  pl['[[MinimumFractionDigits]]'] = mnfd;
  pl['[[MaximumFractionDigits]]'] = mxfd;
  if (mnsd !== undefined || mxsd !== undefined) {
    mnsd = defaultNumberOption(mnsd, 1, 21, 1);
    mxsd = defaultNumberOption(mxsd, mnsd, 21, 21);
    pl['[[MinimumSignificantDigits]]'] = mnsd;
    pl['[[MaximumSignificantDigits]]'] = mxsd;
  }
}

export class PluralRules implements Intl.PluralRules {
  private readonly '[[Locale]]': string;
  private readonly '[[Type]]': Intl.PluralRulesOptions['type'] = 'cardinal';
  private '[[MinimumIntegerDigits]]': number | undefined;
  private '[[MinimumFractionDigits]]': number | undefined;
  private '[[MaximumFractionDigits]]': number | undefined;
  private '[[MinimumSignificantDigits]]': number | undefined;
  private '[[MaximumSignificantDigits]]': number | undefined;
  private pluralRuleData: PluralRulesData;
  constructor(locales?: string | string[], options?: Intl.PluralRulesOptions) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof PluralRules ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.PluralRules must be called with 'new'");
    }
    const opts =
      options === undefined ? Object.create(null) : toObject(options);
    if (locales === undefined) {
      this['[[Locale]]'] = DEFAULT_LOCALE;
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
      this['[[Locale]]'] = resolvedLocales[0];
    }
    this['[[Type]]'] = getOption(
      opts,
      'type',
      'string',
      ['cardinal', 'ordinal'],
      'cardinal'
    );
    // test262/test/intl402/PluralRules/constructor-options-throwing-getters.js
    getOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    );

    this.pluralRuleData = PluralRules.__localeData__[this['[[Locale]]']];
    setNumberFormatDigitOptions(this, opts, 0, 3);
  }
  public resolvedOptions() {
    validateInstance(this, 'resolvedOptions');
    const opts = Object.create(Object.prototype);

    Object.defineProperties(opts, {
      locale: {
        value: this['[[Locale]]'],
        writable: true,
        enumerable: true,
        configurable: true,
      },
      type: {
        value: (this['[[Type]]'] as String).valueOf(),
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });
    if (this['[[MinimumIntegerDigits]]'] !== undefined) {
      Object.defineProperty(opts, 'minimumIntegerDigits', {
        value: this['[[MinimumIntegerDigits]]'],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (this['[[MinimumFractionDigits]]'] !== undefined) {
      Object.defineProperty(opts, 'minimumFractionDigits', {
        value: this['[[MinimumFractionDigits]]'],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (this['[[MaximumFractionDigits]]'] !== undefined) {
      Object.defineProperty(opts, 'maximumFractionDigits', {
        value: this['[[MaximumFractionDigits]]'],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (this['[[MinimumSignificantDigits]]'] !== undefined) {
      Object.defineProperty(opts, 'minimumSignificantDigits', {
        value: this['[[MinimumSignificantDigits]]'],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (this['[[MaximumSignificantDigits]]'] !== undefined) {
      Object.defineProperty(opts, 'maximumSignificantDigits', {
        value: this['[[MaximumSignificantDigits]]'],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    Object.defineProperty(opts, 'pluralCategories', {
      value: [
        ...this.pluralRuleData.categories[
          (this['[[Type]]'] as String).valueOf() as 'cardinal'
        ],
      ],
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return opts;
  }
  public select(val: number): PluralRule {
    validateInstance(this, 'select');
    return this.pluralRuleData.fn(
      Math.abs(Number(val)),
      this['[[Type]]'] == 'ordinal'
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
