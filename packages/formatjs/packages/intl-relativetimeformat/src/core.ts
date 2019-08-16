import {
  LocaleData,
  Unit,
  LocaleFieldsData,
  RelativeTimeOpt,
  FormattableUnit,
  VALID_UNITS,
} from './types';

// -- RelativeTimeFormat -----------------------------------------------------------

export interface IntlRelativeTimeFormatOptions {
  /**
   * The locale matching algorithm to use.
   * Possible values are "lookup" and "best fit"; the default is "best fit".
   * For information about this option, see
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_negotiation.
   */
  localeMatcher?: 'best fit' | 'lookup';
  /**
   * The format of output message. Possible values are:
   * - "always" (default, e.g., 1 day ago),
   * - or "auto" (e.g., yesterday).
   * The "auto" value allows to not always have to
   * use numeric values in the output.
   */
  numeric?: 'always' | 'auto';
  /**
   * The length of the internationalized message. Possible values are:
   * - "long" (default, e.g., in 1 month)
   * - "short" (e.g., in 1 mo.),
   * - or "narrow" (e.g., in 1 mo.).
   * The narrow style could be similar to the short style for some locales.
   */
  style?: 'long' | 'short' | 'narrow';
}

export interface ResolvedIntlRelativeTimeFormatOptions
  extends Pick<IntlRelativeTimeFormatOptions, 'style' | 'numeric'> {
  /**
   * The BCP 47 language tag for the locale actually used.
   * If any Unicode extension values were requested in the
   * input BCP 47 language tag that led to this locale,
   * the key-value pairs that were requested and are
   * supported for this locale are included in locale.
   */
  locale: string;
  /**
   * The value requested using the Unicode
   * extension key "nu" or filled in as a default.
   */
  numberingSystem: string;
}

export type Part = LiteralPart | RelativeTimeFormatNumberPart;

export interface LiteralPart {
  type: 'literal';
  value: string;
}

export interface RelativeTimeFormatNumberPart extends Intl.NumberFormatPart {
  unit: FormattableUnit;
}

/**
 * Find the correct field data in our CLDR data
 * @param locale locale
 */
function findFields(locale: string) {
  const localeData = RelativeTimeFormat.__localeData__;
  let data: LocaleData | undefined = localeData[locale.toLowerCase()];

  // The locale data is de-duplicated, so we have to traverse the locale's
  // hierarchy until we find `fields` to return.
  while (data) {
    if (data.fields) {
      return data.fields;
    }

    data = data.parentLocale
      ? localeData[data.parentLocale.toLowerCase()]
      : undefined;
  }

  throw new Error(
    `Locale data added to RelativeTimeFormat is missing 'fields' for "${locale}"`
  );
}

function resolveLocale(locales: Array<string | undefined>) {
  const {
    __localeData__: localeData,
    __languageAliases__: languageAliases,
  } = RelativeTimeFormat;
  let resolvedLocales: string[] = (Array.isArray(locales) ? locales : [locales])
    .filter<string>((s): s is string => typeof s === 'string')
    .map(l => languageAliases[l] || l);

  let i, len, localeParts, data;

  const supportedLocales = [];

  // Using the set of locales + the default locale, we look for the first one
  // which that has been registered. When data does not exist for a locale, we
  // traverse its ancestors to find something that's been registered within
  // its hierarchy of locales. Since we lack the proper `parentLocale` data
  // here, we must take a naive approach to traversal.
  for (i = 0, len = resolvedLocales.length; i < len; i += 1) {
    localeParts = resolvedLocales[i].toLowerCase().split('-');

    while (localeParts.length) {
      data = localeData[localeParts.join('-')];
      if (data) {
        // Return the normalized locale string; e.g., we return "en-US",
        // instead of "en-us".
        supportedLocales.push(data.locale);
        break;
      }

      localeParts.pop();
    }
  }

  return supportedLocales;
}

function findFieldData(
  fields: LocaleFieldsData,
  unit: Unit,
  style: IntlRelativeTimeFormatOptions['style']
) {
  if (style == 'long') {
    return fields[unit as 'day'];
  }
  if (style == 'narrow') {
    return (
      fields[`${unit}-narrow` as 'day-narrow'] ||
      fields[`${unit}-short` as 'day-short']
    );
  }
  return fields[`${unit}-short` as 'day-short'];
}

function objectIs(x: any, y: any) {
  if (Object.is) {
    return Object.is(x, y);
  }
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    return x !== 0 || 1 / x === 1 / y;
  }
  // Step 6.a: NaN == NaN
  return x !== x && y !== y;
}

function resolvePastOrFuture(value: number): 'past' | 'future' {
  return objectIs(value, -0)
    ? 'past'
    : objectIs(value, +0)
    ? 'future'
    : value < 0
    ? 'past'
    : 'future';
}

function validateInstance(instance: any, method: string) {
  if (!(instance instanceof RelativeTimeFormat)) {
    throw new TypeError(
      `Method Intl.RelativeTimeFormat.prototype.${method} called on incompatible receiver ${String(
        instance
      )}`
    );
  }
}

function validateUnit(unit: any): Unit {
  // `unit + ''` to guard against `Symbol()`
  if (!~VALID_UNITS.indexOf(unit + '')) {
    throw new RangeError(
      `Invalid unit argument for format() '${String(unit)}'`
    );
  }
  const resolvedUnit = (unit[unit.length - 1] === 's'
    ? unit.slice(0, unit.length - 1)
    : unit) as Unit;
  return resolvedUnit;
}

function validateValue(value: number | string, method = 'format') {
  const parsedValue =
    typeof value === 'string' ? new Number(value).valueOf() : value;
  if (!isFinite(parsedValue)) {
    throw new RangeError(
      `Value need to be finite number for Intl.RelativeTimeFormat.prototype.${method}()`
    );
  }
  return parsedValue;
}

function isString(s?: string): s is string {
  return !!s;
}

function toObject<T>(
  arg: T
): T extends null ? never : T extends undefined ? never : T {
  if (arg == null) {
    throw new TypeError('undefined/null cannot be converted to object');
  }
  return Object(arg);
}

/**
 * https://tc39.es/ecma402/#sec-getoption
 * @param opts
 * @param prop
 * @param type
 * @param values
 * @param fallback
 */
function getOption<T extends object, K extends keyof T>(
  opts: T,
  prop: K,
  type: 'string' | 'boolean',
  values?: T[K][],
  fallback?: T[K]
): T[K] | undefined {
  // const descriptor = Object.getOwnPropertyDescriptor(opts, prop);
  let value: any = opts[prop];
  if (value !== undefined) {
    if (type !== 'boolean' && type !== 'string') {
      throw new TypeError('invalid type');
    }
    if (type === 'boolean') {
      value = new Boolean(value);
    }
    if (type === 'string') {
      value = new String(value);
    }
    if (values !== undefined && !values.filter(val => val == value).length) {
      throw new RangeError(`${value} in not within ${values}`);
    }
    return value;
  }
  return fallback;
}

function intersection(
  arr1: Array<string | undefined>,
  arr2: Array<string | undefined>
): Array<string | undefined> {
  return arr1.filter(s => ~arr2.indexOf(s as string));
}

const DEFAULT_LOCALE = new Intl.NumberFormat().resolvedOptions().locale;

export default class RelativeTimeFormat {
  private readonly _nf: Intl.NumberFormat;
  private readonly _pl: Intl.PluralRules;
  private readonly _fields: LocaleFieldsData;
  private readonly _locale: string;
  private readonly _style: IntlRelativeTimeFormatOptions['style'];
  private readonly _numeric: IntlRelativeTimeFormatOptions['numeric'];
  private readonly _localeMatcher: IntlRelativeTimeFormatOptions['localeMatcher'];
  private readonly _numberingSystem: string;
  constructor(
    ...[locales, options]: [
      string | string[] | undefined,
      IntlRelativeTimeFormatOptions | undefined
    ]
  ) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof RelativeTimeFormat ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.RelativeTimeFormat must be called with 'new'");
    }
    const opts =
      options === undefined ? Object.create(null) : toObject(options);
    if (locales === undefined) {
      this._locale = DEFAULT_LOCALE;
    } else {
      const resolvedLocales = resolveLocale([
        ...intersection(
          Intl.NumberFormat.supportedLocalesOf(locales),
          Intl.PluralRules.supportedLocalesOf(locales)
        ),
        DEFAULT_LOCALE,
      ]);
      if (resolvedLocales.length < 1) {
        throw new Error(
          'No locale data has been added to IntlRelativeTimeFormat for: ' +
            resolvedLocales.join(', ') +
            ', or the default locale: ' +
            DEFAULT_LOCALE
        );
      }
      this._locale = resolvedLocales[0];
    }

    this._localeMatcher = getOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    );
    this._style = getOption(
      opts,
      'style',
      'string',
      ['long', 'narrow', 'short'],
      'long'
    );
    this._numeric = getOption(
      opts,
      'numeric',
      'string',
      ['always', 'auto'],
      'always'
    );
    this._fields = findFields(this._locale);

    this._nf = new Intl.NumberFormat(this._locale);
    this._pl = new Intl.PluralRules(this._locale);
    this._numberingSystem = this._nf.resolvedOptions().numberingSystem;
  }
  format(value: number | string, unit: FormattableUnit): string {
    validateInstance(this, 'format');
    const resolvedUnit = validateUnit(unit);
    const parsedValue = validateValue(value);
    const {_style: style, _numeric: numeric} = this;
    const fieldData = findFieldData(this._fields, resolvedUnit, style);
    if (!fieldData) {
      throw new Error(`Unsupported unit ${unit}`);
    }
    const {relative, relativeTime} = fieldData;
    let result: string = '';
    // We got a match for things like yesterday
    if (
      numeric == 'auto' &&
      (result = relative[String(parsedValue) as '0'] || '')
    ) {
      return result;
    }

    const selector = this._pl.select(parsedValue) as RelativeTimeOpt;
    const futureOrPastData = relativeTime[resolvePastOrFuture(parsedValue)];
    const msg = futureOrPastData[selector] || futureOrPastData.other;
    return msg!.replace(/\{0\}/, this._nf.format(Math.abs(parsedValue)));
  }
  formatToParts(value: number | string, unit: FormattableUnit): Part[] {
    validateInstance(this, 'format');
    const resolvedUnit = validateUnit(unit);
    const parsedValue = validateValue(value, 'formatToParts');
    const {_style: style, _numeric: numeric} = this;
    const fieldData = findFieldData(this._fields, resolvedUnit, style);
    if (!fieldData) {
      throw new Error(`Unsupported unit ${unit}`);
    }
    const {relative, relativeTime} = fieldData;
    let result: string = '';
    // We got a match for things like yesterday
    if (
      numeric == 'auto' &&
      (result = relative[String(parsedValue) as '0'] || '')
    ) {
      return [
        {
          type: 'literal',
          value: result,
        },
      ];
    }

    const selector = this._pl.select(parsedValue) as RelativeTimeOpt;
    const futureOrPastData = relativeTime[resolvePastOrFuture(parsedValue)];
    const msg = futureOrPastData[selector] || futureOrPastData.other;
    const valueParts = this._nf
      .formatToParts(Math.abs(parsedValue))
      .map(p => ({...p, unit: resolvedUnit}));
    return msg!
      .split(/(\{0\})/)
      .filter<string>(isString)
      .reduce(
        (parts: Part[], str) => [
          ...parts,
          ...(str === '{0}'
            ? valueParts
            : [{type: 'literal', value: str} as LiteralPart]),
        ],
        []
      );
  }

  resolvedOptions(): ResolvedIntlRelativeTimeFormatOptions {
    validateInstance(this, 'resolvedOptions');

    // test262/test/intl402/RelativeTimeFormat/prototype/resolvedOptions/type.js
    const opts = Object.create(Object.prototype);
    Object.defineProperties(opts, {
      locale: {
        value: this._locale,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      style: {
        value: (this._style as String).valueOf(),
        writable: true,
        enumerable: true,
        configurable: true,
      },
      numeric: {
        value: (this._numeric as String).valueOf(),
        writable: true,
        enumerable: true,
        configurable: true,
      },
      numberingSystem: {
        value: (this._numberingSystem as String).valueOf(),
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });
    return opts;
  }

  toString() {
    return '[object Intl.RelativeTimeFormat]';
  }

  public static supportedLocalesOf = (
    locales: string | string[],
    ...[opts]: [
      Pick<IntlRelativeTimeFormatOptions, 'localeMatcher'> | undefined
    ]
  ) => {
    // test262/test/intl402/RelativeTimeFormat/constructor/supportedLocalesOf/options-toobject.js
    let localeMatcher: IntlRelativeTimeFormatOptions['localeMatcher'] =
      'best fit';
    // test262/test/intl402/RelativeTimeFormat/constructor/supportedLocalesOf/options-null.js
    if (opts === null) {
      throw new TypeError('opts cannot be null');
    }
    if (opts) {
      localeMatcher = getOption(
        opts,
        'localeMatcher',
        'string',
        ['best fit', 'lookup'],
        'best fit'
      );
    }
    // test262/test/intl402/RelativeTimeFormat/constructor/supportedLocalesOf/result-type.js
    return resolveLocale([
      ...intersection(
        Intl.NumberFormat.supportedLocalesOf(locales, {localeMatcher}),
        Intl.PluralRules.supportedLocalesOf(locales, {localeMatcher})
      ),
    ]);
  };

  static __localeData__: Record<string, LocaleData> = {};
  public static __addLocaleData(...data: LocaleData[]) {
    for (const datum of data) {
      if (!(datum && datum.locale)) {
        throw new Error(
          'Locale data provided to RelativeTimeFormat is missing a ' +
            '`locale` property value'
        );
      }

      RelativeTimeFormat.__localeData__[datum.locale.toLowerCase()] = datum;
    }
  }
  static __languageAliases__: Record<string, string> = {};
  public static __setLanguageAliases(aliases: Record<string, string>) {
    RelativeTimeFormat.__languageAliases__ = aliases;
  }
  public static polyfilled = true;
}
