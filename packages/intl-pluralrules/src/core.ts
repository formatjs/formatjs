import {
  LDMLPluralRule,
  toObject,
  getOption,
  PluralRulesLocaleData,
  PluralRulesData,
  unpackData,
  getCanonicalLocales,
  createResolveLocale,
  supportedLocales,
  isMissingLocaleDataError,
  setInternalSlot,
  getInternalSlot,
  setNumberFormatDigitOptions,
  NumberFormatDigitInternalSlots,
} from '@formatjs/intl-utils';

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

function formatNumericToString(
  internalSlotMap: WeakMap<PluralRules, PluralRulesInternal>,
  pl: PluralRules,
  x: number
) {
  const minimumSignificantDigits = getInternalSlot(
    internalSlotMap,
    pl,
    'minimumSignificantDigits'
  );
  const maximumSignificantDigits = getInternalSlot(
    internalSlotMap,
    pl,
    'maximumSignificantDigits'
  );
  if (
    minimumSignificantDigits !== undefined &&
    maximumSignificantDigits !== undefined
  ) {
    return toRawPrecision(
      x,
      minimumSignificantDigits,
      maximumSignificantDigits
    );
  }
  return toRawFixed(
    x,
    getInternalSlot(internalSlotMap, pl, 'minimumIntegerDigits'),
    getInternalSlot(internalSlotMap, pl, 'minimumFractionDigits')!,
    getInternalSlot(internalSlotMap, pl, 'maximumFractionDigits')!
  );
}

interface PluralRulesInternal extends NumberFormatDigitInternalSlots {
  initializedPluralRules: boolean;
  locale: string;
  type: 'cardinal' | 'ordinal';
}

export class PluralRules implements Intl.PluralRules {
  constructor(locales?: string | string[], options?: Intl.PluralRulesOptions) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof PluralRules ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.PluralRules must be called with 'new'");
    }
    const requestedLocales = getCanonicalLocales(locales);
    const opt: any = Object.create(null);
    const opts =
      options === undefined ? Object.create(null) : toObject(options);
    setInternalSlot(
      PluralRules.__INTERNAL_SLOT_MAP__,
      this,
      'initializedPluralRules',
      true
    );
    const matcher = getOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    );
    opt.localeMatcher = matcher;
    setInternalSlot(
      PluralRules.__INTERNAL_SLOT_MAP__,
      this,
      'type',
      getOption(opts, 'type', 'string', ['cardinal', 'ordinal'], 'cardinal')
    );
    setNumberFormatDigitOptions(
      PluralRules.__INTERNAL_SLOT_MAP__,
      this,
      opts,
      0,
      3
    );
    const r = createResolveLocale(PluralRules.getDefaultLocale)(
      PluralRules.availableLocales,
      requestedLocales,
      opt,
      PluralRules.relevantExtensionKeys,
      PluralRules.localeData
    );
    setInternalSlot(
      PluralRules.__INTERNAL_SLOT_MAP__,
      this,
      'locale',
      r.locale
    );
  }
  public resolvedOptions() {
    validateInstance(this, 'resolvedOptions');
    const opts = Object.create(null);
    opts.locale = getInternalSlot(
      PluralRules.__INTERNAL_SLOT_MAP__,
      this,
      'locale'
    );
    opts.type = getInternalSlot(
      PluralRules.__INTERNAL_SLOT_MAP__,
      this,
      'type'
    );
    ([
      'minimumIntegerDigits',
      'minimumFractionDigits',
      'maximumFractionDigits',
      'minimumSignificantDigits',
      'maximumSignificantDigits',
    ] as Array<keyof PluralRulesInternal>).forEach(field => {
      const val = getInternalSlot(
        PluralRules.__INTERNAL_SLOT_MAP__,
        this,
        field
      );
      if (val !== undefined) {
        opts[field] = val;
      }
    });

    opts.pluralCategories = [
      ...PluralRules.localeData[opts.locale].categories[
        opts.type as 'cardinal'
      ],
    ];
    return opts;
  }
  public select(val: number): LDMLPluralRule {
    validateInstance(this, 'select');
    const locale = getInternalSlot(
      PluralRules.__INTERNAL_SLOT_MAP__,
      this,
      'locale'
    );
    const type = getInternalSlot(
      PluralRules.__INTERNAL_SLOT_MAP__,
      this,
      'type'
    );
    return PluralRules.localeData[locale].fn(
      formatNumericToString(
        PluralRules.__INTERNAL_SLOT_MAP__,
        this,
        Math.abs(Number(val))
      ),
      type == 'ordinal'
    );
  }
  toString() {
    return '[object Intl.PluralRules]';
  }
  public static supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<Intl.PluralRulesOptions, 'localeMatcher'>
  ) {
    return supportedLocales(
      PluralRules.availableLocales,
      getCanonicalLocales(locales),
      options
    );
  }
  public static __addLocaleData(...data: PluralRulesLocaleData[]) {
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
          PluralRules.localeData[locale] = unpackData(locale, datum);
        } catch (e) {
          if (isMissingLocaleDataError(e)) {
            // If we just don't have data for certain locale, that's ok
            return;
          }
          throw e;
        }
      });
    }
    PluralRules.availableLocales = Object.keys(PluralRules.localeData);
    if (!PluralRules.__defaultLocale) {
      PluralRules.__defaultLocale = PluralRules.availableLocales[0];
    }
  }
  static localeData: Record<string, PluralRulesData> = {};
  private static availableLocales: string[] = [];
  private static __defaultLocale = 'en';
  private static getDefaultLocale() {
    return PluralRules.__defaultLocale;
  }
  private static relevantExtensionKeys = [];
  public static polyfilled = true;
  private static readonly __INTERNAL_SLOT_MAP__ = new WeakMap<
    PluralRules,
    PluralRulesInternal
  >();
}

try {
  // https://github.com/tc39/test262/blob/master/test/intl402/PluralRules/length.js
  Object.defineProperty(PluralRules, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  // https://github.com/tc39/test262/blob/master/test/intl402/RelativeTimeFormat/constructor/length.js
  Object.defineProperty(PluralRules.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  // https://github.com/tc39/test262/blob/master/test/intl402/RelativeTimeFormat/constructor/supportedLocalesOf/length.js
  Object.defineProperty(PluralRules.supportedLocalesOf, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  });
} catch (ex) {
  // Meta fixes for test262
}
