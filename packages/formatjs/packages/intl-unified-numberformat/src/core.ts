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

// function generateContinuousILND(startChar: string): NumberInternalSlots['ilnd'] {
//   const startCharCode = startChar.charCodeAt(0);
//   const arr = new Array<string>(10) as NumberInternalSlots['ilnd'];
//   for (let i = 0; i < 10; i++) {
//     arr[i] = String.fromCharCode(startCharCode + i);
//   }
//   return arr;
// }

// // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#table-numbering-system-digits
// const ILND = (function() {
//   return {
//     arab: generateContinuousILND('\u0660'),
//     arabext: generateContinuousILND('\u06f0'),
//     bali: generateContinuousILND('\u1b50'),
//     beng: generateContinuousILND('\u09e6'),
//     deva: generateContinuousILND('\u0966'),
//     fullwide: generateContinuousILND('\uff10'),
//     gujr: generateContinuousILND('\u0ae6'),
//     guru: generateContinuousILND('\u0a66'),
//     khmr: generateContinuousILND('\u17e0'),
//     knda: generateContinuousILND('\u0ce6'),
//     laoo: generateContinuousILND('\u0ed0'),
//     latn: generateContinuousILND('\u0030'),
//     limb: generateContinuousILND('\u1946'),
//     mlym: generateContinuousILND('\u0d66'),
//     mong: generateContinuousILND('\u1810'),
//     mymr: generateContinuousILND('\u1040'),
//     orya: generateContinuousILND('\u0b66'),
//     tamldec: generateContinuousILND('\u0be6'),
//     telu: generateContinuousILND('\u0c66'),
//     thai: generateContinuousILND('\u0e50'),
//     tibt: generateContinuousILND('\u0f20'),
//     hanidec: [
//       '\u3007',
//       '\u4e00',
//       '\u4e8c',
//       '\u4e09',
//       '\u56db',
//       '\u4e94',
//       '\u516d',
//       '\u4e03',
//       '\u516b',
//       '\u4e5d',
//     ],
//   };
// })();

/**
 * Check if a formatting number with unit is supported
 * @public
 * @param unit unit to check
 */
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
  compactDisplay?: 'short' | 'long';
  currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol';
  currencySign?: 'standard' | 'accounting';
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
  unit?: Unit;
  unitDisplay?: 'long' | 'short' | 'narrow';
}

export interface ResolvedUnifiedNumberFormatOptions
  extends Intl.ResolvedNumberFormatOptions {
  compactDisplay?: 'short' | 'long';
  currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol';
  currencySign?: 'standard' | 'accounting';
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
  unit?: Unit;
  unitDisplay?: 'long' | 'short' | 'narrow';
}

const NativeNumberFormat = Intl.NumberFormat;

interface UnifiedNumberFormatInternal {
  locale: string;
  unit?: string;
  unitDisplay?: string;
  dataLocale: string;
  roundingType?: 'significantDigits' | 'fractionDigits' | 'compactRounding';
  notation?: 'compact';
  compactDisplay?: 'short' | 'long';
  signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
  currencyDisplay?: 'code' | 'symbol' | 'narrowSymbol' | 'name';
}

export class UnifiedNumberFormat implements Intl.NumberFormat {
  private nf: Intl.NumberFormat;
  private pl: Intl.PluralRules;
  private unitPattern?: UnitData;
  private currencyNarrowSymbol?: string;
  constructor(
    locales?: string | string[],
    options: UnifiedNumberFormatOptions = {}
  ) {
    options = options === undefined ? Object.create(null) : toObject(options);
    const {style, unit, unitDisplay, currencyDisplay, ...coreOpts} = options;
    const isUnit = style === 'unit';
    const isNarrow = style === 'currency' && currencyDisplay === 'narrowSymbol';

    if (isUnit || isNarrow) {
      const requestedLocales = getCanonicalLocales(locales);
      const opt: any = Object.create(null);
      const matcher = getOption(
        options,
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
      const formatterData = localeData[r.locale];

      if (isUnit) {
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
        this.unitPattern = formatterData.units![unit];
      } else if (isNarrow) {
        if (!options.currency) {
          throw new TypeError('Currency code is required with currency style.');
        }
        setInternalSlot(
          UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
          this,
          'currencyDisplay',
          currencyDisplay
        );
        this.currencyNarrowSymbol = formatterData.currencies![
          options.currency
        ]?.narrowSymbol;
      }
    }

    this.nf = new NativeNumberFormat(locales, {
      ...coreOpts,
      // If the implementation does not have such a representation of currency,
      // use the currency code as fallback.
      currencyDisplay:
        currencyDisplay === 'narrowSymbol' ? 'symbol' : currencyDisplay,
      style: style === 'unit' ? 'decimal' : style,
    });
    setInternalSlot(
      UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
      this,
      'unit',
      undefined
    );
    this.pl = new Intl.PluralRules(locales);
  }

  format(num: number) {
    const formattedNum = this.formatToParts(num)
      .map(x => x.value)
      .join('');
    // TODO: support unit in formatToParts.
    if (this.unitPattern) {
      const unitDisplay = getInternalSlot(
        UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
        this,
        'unitDisplay'
      );
      const pl = this.pl.select(num);
      const pattern = this.unitPattern[unitDisplay as 'long'][
        pl === 'one' ? 'one' : 'other'
      ]!;
      return pattern.replace('{0}', formattedNum);
    }
    return formattedNum;
  }

  formatToParts(num: number) {
    const parts = this.nf.formatToParts(num);
    const currencyDisplay = getInternalSlot(
      UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
      this,
      'currencyDisplay'
    );
    // Replace 'currency' token with the narrowSymbol counterparts.
    if (
      this.currencyNarrowSymbol &&
      currencyDisplay === 'narrowSymbol' &&
      this.nf.resolvedOptions().style === 'currency'
    ) {
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].type === 'currency') {
          parts[i].value = this.currencyNarrowSymbol;
          break;
        }
      }
    }
    return parts;
  }

  resolvedOptions() {
    const ro = this.nf.resolvedOptions() as ResolvedUnifiedNumberFormatOptions;
    const unit = getInternalSlot(
      UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
      this,
      'unit'
    );
    const currencyDisplay = getInternalSlot(
      UnifiedNumberFormat.__INTERNAL_SLOT_MAP__,
      this,
      'currencyDisplay'
    );
    if (ro.style === 'currency' && currencyDisplay === 'narrowSymbol') {
      ro.currencyDisplay = 'narrowSymbol';
    }
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
          UnifiedNumberFormat.localeData[locale] = unpackData(
            locale,
            datum,
            (all, d) => ({
              currencies: {...all.currencies, ...d.currencies},
              units: {...all.units, ...d.units},
            })
          );
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
  static localeData: UnifiedNumberFormatLocaleData['data'] = {};
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
