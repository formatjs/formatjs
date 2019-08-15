import {Unit} from './units-constants';

function resolveLocale(unit: Unit, locales: Array<string | undefined>) {
  const {__unitLocaleData__: localeData} = UnifiedNumberFormat;
  let resolvedLocales: string[] = (Array.isArray(locales)
    ? locales
    : [locales]
  ).filter<string>((s): s is string => typeof s === 'string');

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
      if (localeData[unit]) {
        data = localeData[unit][localeParts.join('-')];
        if (data) {
          // Return the normalized locale string; e.g., we return "en-US",
          // instead of "en-us".
          supportedLocales.push(data.locale);
          break;
        }

        localeParts.pop();
      }
    }
  }

  return supportedLocales;
}

export interface UnifiedNumberFormatOptions extends Intl.NumberFormatOptions {
  unit?: Unit;
  unitDisplay?: 'long' | 'short' | 'narrow';
}

export default class UnifiedNumberFormat {
  private unit: string | undefined = undefined;
  private unitDisplay: 'long' | 'short' | 'narrow' | undefined = undefined;
  private nf: Intl.NumberFormat;
  private locale?: string;
  constructor(
    locale?: string,
    {style, unit, unitDisplay, ...options}: UnifiedNumberFormatOptions = {}
  ) {
    if (style === 'unit') {
      if (!unit) {
        throw new TypeError('Unit is required for `style: unit`');
      }
      this.unit = unit;
      this.unitDisplay = unitDisplay || 'short';
      this.locale = resolveLocale(unit, [locale])[0];
    }
    this.nf = new Intl.NumberFormat(locale, {
      ...options,
      style: style === 'unit' ? 'decimal' : style,
    });
  }

  format(num: number) {
    const formattedNum = this.nf.format(num);
    if (this.unit) {
      const locale = this.nf.resolvedOptions().locale;
      const patternData =
        UnifiedNumberFormat.__unitLocaleData__[this.unit][locale];
      const pl = new Intl.PluralRules(locale).select(num);
      return patternData.fields![this.unitDisplay as 'long'][
        pl === 'one' ? 'one' : 'other'
      ]!.replace('{0}', formattedNum);
    }
    return formattedNum;
  }

  formatToParts(num: number) {
    return this.nf.formatToParts(num);
  }

  static supportedLocalesOf(
    ...args: Parameters<typeof Intl.NumberFormat.supportedLocalesOf>
  ) {
    return Intl.NumberFormat.supportedLocalesOf(...args);
  }

  static __unitLocaleData__: Record<string, Record<string, LocaleData>> = {};
  static __addUnitLocaleData(unit: Unit, ...data: LocaleData[]) {
    if (!UnifiedNumberFormat.__unitLocaleData__[unit]) {
      UnifiedNumberFormat.__unitLocaleData__[unit] = {};
    }
    for (const datum of data) {
      if (!(datum && datum.locale)) {
        throw new Error(
          'Locale data provided to UnifiedNumberFormat is missing a ' +
            '`locale` property value'
        );
      }
      UnifiedNumberFormat.__unitLocaleData__[unit][
        datum.locale.toLowerCase()
      ] = datum;
    }
  }
}

interface LocaleData {
  locale: string;
  parentLocale?: string;
  fields?: UnitData;
}
interface UnitPattern {
  one?: string;
  other?: string;
  perUnit?: string;
}

export interface UnitData {
  displayName: string;
  long: UnitPattern;
  short?: UnitPattern;
  narrow?: UnitPattern;
}
