import {Unit} from './units-constants';
import {
  UnitData,
  createResolveLocale,
  toObject,
  UnifiedNumberFormatLocaleData,
  supportedLocales,
  getCanonicalLocales,
  unpackData,
  setInternalSlot,
  getOption,
  getInternalSlot,
} from '@formatjs/intl-utils';

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

const NativeNumberFormat = Intl.NumberFormat;

interface UnifiedNumberFormatInternal {
  locale: string;
  unit: string;
  unitDisplay: string;
  dataLocale: string;
  roundingType: 'significantDigits' | 'fractionDigits' | 'compactRounding';
  notation: 'compact';
  compactDisplay: 'short' | 'long';
  signDisplay: 'auto' | 'always' | 'never' | 'exceptZero';
}

export class UnifiedNumberFormat implements Intl.NumberFormat {
  private nf: Intl.NumberFormat;
  private pl: Intl.PluralRules;
  private patternData?: UnitData;
  constructor(
    locales: string | string[],
    options: UnifiedNumberFormatOptions = {}
  ) {
    const {style, unit, unitDisplay, ...coreOpts} = options;
    if (style === 'unit') {
      if (!unit) {
        throw new TypeError('Unit is required for `style: unit`');
      }
      setInternalSlot(
        UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
        this,
        'unit',
        unit
      );
      setInternalSlot(
        UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
        this,
        'unitDisplay',
        getOption(
          options,
          'unitDisplay',
          'string',
          ['long', 'short', 'narrow'],
          'short'
        )!
      );
      const requestedLocales = getCanonicalLocales(locales);
      const opt: any = Object.create(null);
      const opts =
        options === undefined ? Object.create(null) : toObject(options);
      const matcher = getOption(
        opts,
        'localeMatcher',
        'string',
        ['best fit', 'lookup'],
        'best fit'
      );
      opt.localeMatcher = matcher;
      const {localeData} = UnifiedNumberFormat;
      const r = createResolveLocale(UnifiedNumberFormat.getDefaultLocale)(
        UnifiedNumberFormat.availableLocales,
        requestedLocales,
        opt,
        UnifiedNumberFormat.relevantExtensionKeys,
        localeData
      );
      setInternalSlot(
        UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
        this,
        'locale',
        r.locale
      );
      this.patternData = localeData[r.locale][unit];
    }
    this.nf = new NativeNumberFormat(locales, {
      ...coreOpts,
      style: style === 'unit' ? 'decimal' : style,
    });
    this.pl = new Intl.PluralRules(locales);
  }

  format(num: number) {
    const formattedNum = this.nf.format(num);
    if (this.patternData) {
      const unitDisplay = getInternalSlot(
        UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
        this,
        'unitDisplay'
      );
      const pl = this.pl.select(num);
      const pattern = this.patternData[unitDisplay as 'long'][
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
    const unit = getInternalSlot(
      UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
      this,
      'unit'
    );
    if (unit) {
      ro.style = 'unit';
      ro.unit = unit as 'megabit';
      ro.unitDisplay = getInternalSlot(
        UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
        this,
        'unitDisplay'
      ) as 'long';
    }
    return ro;
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<UnifiedNumberFormatOptions, 'localeMatcher'>
  ) {
    return supportedLocales(
      UnifiedNumberFormat.availableLocales,
      getCanonicalLocales(locales),
      options as {localeMatcher: 'best fit' | 'lookup'}
    );
  }

  public static __addLocaleData(...data: UnifiedNumberFormatLocaleData[]) {
    for (const datum of data) {
      const availableLocales: string[] = Object.keys(
        [
          ...datum.availableLocales,
          ...Object.keys(datum.aliases),
          ...Object.keys(datum.parentLocales),
        ].reduce((all: Record<string, true>, k) => {
          all[k] = true;
          return all;
        }, {})
      );
      availableLocales.forEach(locale => {
        try {
          UnifiedNumberFormat.localeData[locale] = unpackData(locale, datum);
        } catch (e) {
          // If we can't unpack this data, ignore the locale
        }
      });
    }
    UnifiedNumberFormat.availableLocales = Object.keys(
      UnifiedNumberFormat.localeData
    );
    if (!UnifiedNumberFormat.__defaultLocale) {
      UnifiedNumberFormat.__defaultLocale =
        UnifiedNumberFormat.availableLocales[0];
    }
  }
  static localeData: Record<string, Record<string, UnitData>> = {};
  private static availableLocales: string[] = [];
  private static __defaultLocale = 'en';
  private static getDefaultLocale() {
    return UnifiedNumberFormat.__defaultLocale;
  }
  private static relevantExtensionKeys = [];
  public static polyfilled = true;
  private static readonly __INTERNAL_SLOT_MAP__ = new WeakMap<
    UnifiedNumberFormat,
    UnifiedNumberFormatInternal
  >();
}
