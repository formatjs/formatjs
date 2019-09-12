import {
  findSupportedLocale,
  toObject,
  getOption,
  supportedLocalesOf,
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

interface IntlObj {
  '[[MinimumIntegerDigits]]': number;
  '[[MinimumFractionDigits]]': number | undefined;
  '[[MaximumFractionDigits]]': number | undefined;
  '[[MinimumSignificantDigits]]': number | undefined;
  '[[MaximumSignificantDigits]]': number | undefined;
  '[[RoundingType]]':
    | 'significantDigits'
    | 'fractionDigits'
    | 'compactRounding';
  '[[Notation]]': 'compact';
}

/**
 * https://tc39.es/ecma402/#sec-setnfdigitoptions
 * https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_diff_out.html#sec-setnfdigitoptions
 * @param pl
 * @param opts
 * @param mnfdDefault
 * @param mxfdDefault
 */
function setNumberFormatDigitOptions(
  intlObj: IntlObj,
  opts: Intl.PluralRulesOptions,
  mnfdDefault: number,
  mxfdDefault: number
) {
  const mnid = getNumberOption(opts as any, 'minimumIntegerDigits', 1, 21, 1);
  let mnfd = (opts as any).minimumFractionDigits;
  let mxfd = (opts as any).maximumFractionDigits;
  let mnsd = (opts as any).minimumSignificantDigits;
  let mxsd = (opts as any).maximumSignificantDigits;
  intlObj['[[MinimumIntegerDigits]]'] = mnid;
  intlObj['[[MinimumFractionDigits]]'] = mnfd;
  intlObj['[[MaximumFractionDigits]]'] = mxfd;
  if (mnsd !== undefined || mxsd !== undefined) {
    intlObj['[[RoundingType]]'] = 'significantDigits';
    mnsd = defaultNumberOption(mnsd, 1, 21, 1);
    mxsd = defaultNumberOption(mxsd, mnsd, 21, 21);
    intlObj['[[MinimumSignificantDigits]]'] = mnsd;
    intlObj['[[MaximumSignificantDigits]]'] = mxsd;
  } else if (mnfd !== undefined || mxfd !== undefined) {
    intlObj['[[RoundingType]]'] = 'fractionDigits';
    mnfd = defaultNumberOption(mnfd, 0, 20, mnfdDefault);
    const mxfdActualDefault = Math.max(mnfd, mxfdDefault);
    mxfd = defaultNumberOption(mxfd, mnfd, 20, mxfdActualDefault);
    intlObj['[[MinimumFractionDigits]]'] = mnfd;
    intlObj['[[MaximumFractionDigits]]'] = mxfd;
  } else if (intlObj['[[Notation]]'] === 'compact') {
    intlObj['[[RoundingType]]'] = 'compactRounding';
  } else {
    intlObj['[[RoundingType]]'] = 'fractionDigits';
    intlObj['[[MinimumFractionDigits]]'] = mnfdDefault;
    intlObj['[[MaximumFractionDigits]]'] = mxfdDefault;
  }
}

/**
 * https://tc39.es/ecma402/#sec-torawprecision
 * @param x
 * @param minPrecision
 * @param maxPrecision
 */
function toRawPrecision(x: number, minPrecision: number, maxPrecision: number) {
  let m = x.toPrecision(maxPrecision);
  if (~m.indexOf('.') && maxPrecision > minPrecision) {
    let cut = maxPrecision - minPrecision;
    while (cut > 0 && m[m.length - 1] === '0') {
      m = m.slice(0, m.length - 1);
      cut--;
    }
    if (m[m.length - 1] === '.') {
      return m.slice(0, m.length - 1);
    }
  }
  return m;
}

/**
 * https://tc39.es/ecma402/#sec-torawfixed
 * @param x
 * @param minInteger
 * @param minFraction
 * @param maxFraction
 */
function toRawFixed(
  x: number,
  minInteger: number,
  minFraction: number,
  maxFraction: number
) {
  let cut = maxFraction - minFraction;
  let m = x.toFixed(maxFraction);
  while (cut > 0 && m[m.length - 1] === '0') {
    m = m.slice(0, m.length - 1);
    cut--;
  }
  if (m[m.length - 1] === '.') {
    m = m.slice(0, m.length - 1);
  }
  const int = m.split('.')[0].length;
  if (int < minInteger) {
    let z = '';
    for (; z.length < minInteger - int; z += '0');
    m = z + m;
  }
  return m;
}

function formatNumericToString(intlObj: IntlObj, x: number) {
  if (
    intlObj['[[MinimumSignificantDigits]]'] !== undefined &&
    intlObj['[[MaximumSignificantDigits]]'] !== undefined
  ) {
    return toRawPrecision(
      x,
      intlObj['[[MinimumSignificantDigits]]'],
      intlObj['[[MaximumSignificantDigits]]']
    );
  }
  return toRawFixed(
    x,
    intlObj['[[MinimumIntegerDigits]]'],
    intlObj['[[MinimumFractionDigits]]']!,
    intlObj['[[MaximumFractionDigits]]']!
  );
}

export class PluralRules implements Intl.PluralRules, IntlObj {
  readonly '[[Locale]]': string;
  readonly '[[Type]]': Intl.PluralRulesOptions['type'] = 'cardinal';
  '[[MinimumIntegerDigits]]': number;
  '[[MinimumFractionDigits]]': number | undefined;
  '[[MaximumFractionDigits]]': number | undefined;
  '[[MinimumSignificantDigits]]': number | undefined;
  '[[MaximumSignificantDigits]]': number | undefined;
  '[[RoundingType]]':
    | 'significantDigits'
    | 'fractionDigits'
    | 'compactRounding';
  '[[Notation]]': 'compact';
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
      const localesToLookup = [
        ...(Array.isArray(locales) ? locales : [locales]),
        DEFAULT_LOCALE,
      ];
      const resolvedLocale = findSupportedLocale(
        localesToLookup,
        PluralRules.__localeData__
      );
      if (!resolvedLocale) {
        throw new Error(
          `No locale data has been added to IntlRelativeTimeFormat for: ${localesToLookup.join(
            ', '
          )}`
        );
      }

      this['[[Locale]]'] = resolvedLocale;
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
      formatNumericToString(this, Math.abs(Number(val))),
      this['[[Type]]'] == 'ordinal'
    );
  }
  toString() {
    return '[object Intl.PluralRules]';
  }
  public static supportedLocalesOf(locales: string | string[]) {
    return supportedLocalesOf(locales, PluralRules.__localeData__);
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
