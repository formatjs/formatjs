import {Unit} from './units-constants';
import {resolveSupportedLocales} from '@formatjs/intl-utils';

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

function intersection(
  arr1: Array<string | undefined>,
  arr2: Array<string | undefined>
): Array<string | undefined> {
  return arr1.filter(s => ~arr2.indexOf(s as string));
}

const DEFAULT_LOCALE = new NativeNumberFormat().resolvedOptions().locale;

export class UnifiedNumberFormat implements Intl.NumberFormat {
  private unit: Unit | undefined = undefined;
  private unitDisplay: 'long' | 'short' | 'narrow' | undefined = undefined;
  private nf: Intl.NumberFormat;
  private locale: string;
  private patternData?: UnitData;
  constructor(
    locales: string | string[],
    {style, unit, unitDisplay, ...options}: UnifiedNumberFormatOptions = {}
  ) {
    if (style === 'unit') {
      if (!unit) {
        throw new TypeError('Unit is required for `style: unit`');
      }
      this.unit = unit;
      this.unitDisplay = unitDisplay || 'short';

      const resolvedLocale = resolveSupportedLocales(
        [
          ...intersection(
            NativeNumberFormat.supportedLocalesOf(locales),
            Intl.PluralRules.supportedLocalesOf(locales)
          ),
          DEFAULT_LOCALE,
        ],
        UnifiedNumberFormat.__unitLocaleData__
      )[0];
      this.patternData = findUnitData(resolvedLocale, this.unit);
    }
    this.nf = new NativeNumberFormat(locales, {
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
    return resolveSupportedLocales(
      args[0],
      UnifiedNumberFormat.__unitLocaleData__
    );
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
