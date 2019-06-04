/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */
import {
  LocaleData,
  Unit,
  LocaleFieldsData,
  RelativeTimeOpt,
  FormattableUnit,
  VALID_UNITS
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

export interface IntlRelativeTimeFormat {
  new (
    locales?: string | string[],
    opts?: IntlRelativeTimeFormatOptions
  ): IntlRelativeTimeFormat;
  (
    locales?: string | string[],
    opts?: IntlRelativeTimeFormatOptions
  ): IntlRelativeTimeFormat;
  format(value: number, unit: FormattableUnit): string;
  formatToParts(value: number, unit: FormattableUnit): Part[];
  resolvedOptions(): ResolvedIntlRelativeTimeFormatOptions;
  supportedLocalesOf(
    locales: string | string[],
    opts?: Pick<IntlRelativeTimeFormatOptions, 'localeMatcher'>
  ): string[];
  polyfilled: true;

  /**
   * PRIVATE METHODS/PROPERTIES
   */
  _resolvedOptions: ResolvedIntlRelativeTimeFormatOptions;
  __localeData__: Record<string, LocaleData>;
  __addLocaleData(...data: LocaleData[]): void;
  _fields: LocaleFieldsData;
  _pluralRules: Intl.PluralRules;
  _nf: Intl.NumberFormat;
}

/**
 * Find the correct field data in our CLDR data
 * @param locale locale
 */
function findFields(locale: string) {
  const localeData = IntlRelativeTimeFormatFn.__localeData__;
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
    `Locale data added to IntlRelativeTimeFormat is missing 'fields' for "${locale}"`
  );
}

function resolveLocale(locales: string | string[] = []) {
  if (typeof locales === 'string') {
    locales = [locales];
  }

  // Create a copy of the array so we can push on the default locale.
  locales = (locales || []).concat('en');

  var localeData = RelativeTimeFormat.__localeData__;
  var i, len, localeParts, data;

  // Using the set of locales + the default locale, we look for the first one
  // which that has been registered. When data does not exist for a locale, we
  // traverse its ancestors to find something that's been registered within
  // its hierarchy of locales. Since we lack the proper `parentLocale` data
  // here, we must take a naive approach to traversal.
  for (i = 0, len = locales.length; i < len; i += 1) {
    localeParts = locales[i].toLowerCase().split('-');

    while (localeParts.length) {
      data = localeData[localeParts.join('-')];
      if (data) {
        // Return the normalized locale string; e.g., we return "en-US",
        // instead of "en-us".
        return data.locale;
      }

      localeParts.pop();
    }
  }

  var defaultLocale = locales.pop();
  throw new Error(
    'No locale data has been added to IntlRelativeTimeFormat for: ' +
      locales.join(', ') +
      ', or the default locale: ' +
      defaultLocale
  );
}

function findFieldData(
  fields: LocaleFieldsData,
  unit: Unit,
  style: IntlRelativeTimeFormatOptions['style']
) {
  if (style === 'long') {
    return fields[unit as 'day'];
  }
  if (style === 'narrow') {
    return (
      fields[`${unit}-narrow` as 'day-narrow'] ||
      fields[`${unit}-short` as 'day-short']
    );
  }
  return fields[`${unit}-short` as 'day-short'];
}

const DEFAULT_OPTIONS: IntlRelativeTimeFormatOptions = {
  localeMatcher: 'best fit',
  style: 'long',
  numeric: 'always'
};

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

function RelativeTimeFormat(
  this: IntlRelativeTimeFormat,
  locales?: string | string[],
  opts?: IntlRelativeTimeFormatOptions
) {
  const options = { ...DEFAULT_OPTIONS, ...(opts || {}) };
  this._nf = new Intl.NumberFormat(locales, {
    localeMatcher: options.localeMatcher
  });
  this._pluralRules = new Intl.PluralRules(locales, {
    localeMatcher: options.localeMatcher
  });
  const { numberingSystem } = this._nf.resolvedOptions();
  const locale = resolveLocale(locales);
  this._resolvedOptions = {
    locale,
    style: options.style,
    numeric: options.numeric,
    numberingSystem
  };
  this._fields = findFields(locale);
}

const IntlRelativeTimeFormatFn = RelativeTimeFormat as IntlRelativeTimeFormat;

function validateInstance(instance: any, method: string) {
  if (!(instance instanceof IntlRelativeTimeFormatFn)) {
    throw new TypeError(
      `Method Intl.RelativeTimeFormat.prototype.${method} called on incompatible receiver ${String(
        instance
      )}`
    );
  }
}

function validateUnit(unit: any) {
  if (!~VALID_UNITS.indexOf(unit)) {
    throw new RangeError(
      `Invalid unit argument for format() '${String(unit)}'`
    );
  }
}

Object.defineProperty(RelativeTimeFormat, 'prototype', {
  writable: false,
  enumerable: false,
  configurable: false
});
Object.defineProperty(RelativeTimeFormat.prototype, 'format', {
  value: function format(
    this: IntlRelativeTimeFormat,
    value: number,
    unit: FormattableUnit
  ): string {
    validateInstance(this, 'format');
    validateUnit(unit);
    const resolvedUnit = (unit[unit.length - 1] === 's'
      ? unit.slice(0, unit.length - 1)
      : unit) as Unit;
    const { style, numeric } = this._resolvedOptions;
    const fieldData = findFieldData(this._fields, resolvedUnit, style);
    if (!fieldData) {
      throw new Error(`Unsupported unit ${unit}`);
    }
    const { relative, relativeTime } = fieldData;
    let result: string = '';
    // We got a match for things like yesterday
    if (numeric === 'auto' && (result = relative[String(value) as '0'] || '')) {
      return result;
    }
    const absValue = Math.abs(value);
    // TODO: No need to Math.abs for Intl.PluralRules once
    // https://github.com/eemeli/intl-pluralrules/pull/6 is merged
    const selector = this._pluralRules.select(absValue) as RelativeTimeOpt;
    const futureOrPastData = relativeTime[resolvePastOrFuture(value)];
    const msg = futureOrPastData[selector] || futureOrPastData.other;
    return msg!.replace(/\{0\}/, this._nf.format(absValue));
  },
  writable: true,
  enumerable: false,
  configurable: true
});
RelativeTimeFormat.prototype.formatToParts = function formatToParts(
  this: IntlRelativeTimeFormat,
  value: number,
  unit: FormattableUnit
): Part[] {
  validateInstance(this, 'format');
  validateUnit(unit);
  const resolvedUnit = (unit[unit.length - 1] === 's'
    ? unit.slice(0, unit.length - 1)
    : unit) as Unit;
  const { style, numeric } = this._resolvedOptions;
  const fieldData = findFieldData(this._fields, resolvedUnit, style);
  if (!fieldData) {
    throw new Error(`Unsupported unit ${unit}`);
  }
  const { relative, relativeTime } = fieldData;
  let result: string = '';
  // We got a match for things like yesterday
  if (numeric === 'auto' && (result = relative[String(value) as '0'] || '')) {
    return [
      {
        type: 'literal',
        value: result
      }
    ];
  }

  const selector = this._pluralRules.select(value) as RelativeTimeOpt;
  const futureOrPastData = relativeTime[resolvePastOrFuture(value)];
  const msg = futureOrPastData[selector] || futureOrPastData.other;
  const valueParts = this._nf
    .formatToParts(Math.abs(value))
    .map(p => ({ ...p, unit }));
  return msg!
    .split(/(\{0\})/)
    .filter<string>(isString)
    .reduce(
      (parts: Part[], str) => [
        ...parts,
        ...(str === '{0}'
          ? valueParts
          : [{ type: 'literal', value: str } as LiteralPart])
      ],
      []
    );
};

RelativeTimeFormat.prototype.polyfilled = true;

RelativeTimeFormat.prototype.resolvedOptions = function resolvedOptions(
  this: IntlRelativeTimeFormat
): ResolvedIntlRelativeTimeFormatOptions {
  validateInstance(this, 'resolvedOptions');
  return this._resolvedOptions;
};

function resolvePastOrFuture(value: number): 'past' | 'future' {
  return objectIs(value, -0)
    ? 'past'
    : objectIs(value, +0)
    ? 'future'
    : value < 0
    ? 'past'
    : 'future';
}

function isString(s?: string): s is string {
  return !!s;
}

RelativeTimeFormat.supportedLocalesOf = (
  locales: string | string[],
  opts?: Pick<IntlRelativeTimeFormatOptions, 'localeMatcher'>
) => {
  return Intl.PluralRules.supportedLocalesOf(locales, opts);
};

RelativeTimeFormat.__localeData__ = {} as Record<string, LocaleData>;
RelativeTimeFormat.__addLocaleData = (...data: LocaleData[]) => {
  for (const datum of data) {
    if (!(datum && datum.locale)) {
      throw new Error(
        'Locale data provided to IntlRelativeTimeFormat is missing a ' +
          '`locale` property value'
      );
    }

    IntlRelativeTimeFormatFn.__localeData__[datum.locale.toLowerCase()] = datum;
  }
};

export default IntlRelativeTimeFormatFn;
