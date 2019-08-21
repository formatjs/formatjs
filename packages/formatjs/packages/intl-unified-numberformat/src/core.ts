import {Unit} from './units-constants';

function resolveLocale(locales: Array<string | undefined>) {
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

export function isUnitSupported(unit: Unit) {
  try {
    new Intl.NumberFormat(undefined, {
      style: 'unit',
      unit,
    } as any);
  } catch (e) {
    return false;
  }
  return true;
}

export interface UnifiedNumberFormatOptions extends Intl.NumberFormatOptions {
  unit?: Unit;
  unitDisplay?: 'long' | 'short' | 'narrow';
}

export interface ResolvedUnifiedNumberFormatOptions
  extends Intl.ResolvedNumberFormatOptions {
  unit?: Unit;
  unitDisplay?: 'long' | 'short' | 'narrow';
}

interface LocaleData {
  locale: string;
  parentLocale?: string;
  units: Record<string, UnitData>;
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

const NativeNumberFormat = Intl.NumberFormat;

function findUnitData(locale: string, unit: Unit): UnitData {
  const {__unitLocaleData__: data} = UnifiedNumberFormat;
  let parentLocale = '';
  locale = locale.toLowerCase();
  if (!data[locale]) {
    parentLocale = locale.split('-')[0];
  } else {
    if (data[locale].units[unit]) {
      return data[locale].units[unit];
    }
    if (data[locale].parentLocale) {
      parentLocale = data[locale].parentLocale!;
    } else {
      throw new RangeError(`Cannot find data for ${locale}`);
    }
  }

  return findUnitData(parentLocale, unit);
}

export default class UnifiedNumberFormat implements Intl.NumberFormat {
  private unit: Unit | undefined = undefined;
  private unitDisplay: 'long' | 'short' | 'narrow' | undefined = undefined;
  private nf: Intl.NumberFormat;
  private locale: string;
  private patternData?: UnitData;
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
      const resolvedLocale = resolveLocale([locale])[0];
      this.patternData = findUnitData(resolvedLocale, this.unit);
    }
    this.nf = new NativeNumberFormat(locale, {
      ...options,
      style: style === 'unit' ? 'decimal' : style,
    });
    this.locale = this.nf.resolvedOptions().locale;
  }

  format(num: number) {
    const formattedNum = this.nf.format(num);
    if (this.patternData) {
      const pl = new Intl.PluralRules(this.locale).select(num);
      const pattern = this.patternData[this.unitDisplay as 'long'][
        pl === 'one' ? 'one' : 'other'
      ]!;
      return pattern.replace('{0}', formattedNum);
    }
    return formattedNum;
  }

  formatToParts(num: number) {
    return this.nf.formatToParts(num);
  }

  resolvedOptions() {
    const ro: ResolvedUnifiedNumberFormatOptions = this.nf.resolvedOptions();
    if (this.unit) {
      ro.style = 'unit';
      ro.unit = this.unit;
      ro.unitDisplay = this.unitDisplay;
    }
    return ro;
  }

  static supportedLocalesOf(
    ...args: Parameters<typeof NativeNumberFormat.supportedLocalesOf>
  ) {
    return resolveLocale(NativeNumberFormat.supportedLocalesOf(...args));
  }
  static polyfilled = true;
  static __unitLocaleData__: Record<string, LocaleData> = {};
  static __addUnitLocaleData(data: Record<string, LocaleData>) {
    Object.keys(data).forEach(locale => {
      const datum = data[locale];
      if (!(datum && datum.locale)) {
        throw new Error(
          'Locale data provided to UnifiedNumberFormat is missing a ' +
            '`locale` property value'
        );
      }
      UnifiedNumberFormat.__unitLocaleData__[
        datum.locale.toLowerCase()
      ] = datum;
    });
  }
}
