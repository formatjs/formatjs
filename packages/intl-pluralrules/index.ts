import {
  LDMLPluralRule,
  GetOption,
  PluralRulesLocaleData,
  PluralRulesData,
  unpackData,
  ResolveLocale,
  SupportedLocales,
  isMissingLocaleDataError,
  SetNumberFormatDigitOptions,
  NumberFormatDigitInternalSlots,
  FormatNumericToString,
} from '@formatjs/ecma402-abstract';
import type {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales';
import ToObject from 'es-abstract/2019/ToObject';
import getInternalSlots from './get_internal_slots';
function validateInstance(instance: any, method: string) {
  if (!(instance instanceof PluralRules)) {
    throw new TypeError(
      `Method Intl.PluralRules.prototype.${method} called on incompatible receiver ${String(
        instance
      )}`
    );
  }
}

export interface PluralRulesInternal extends NumberFormatDigitInternalSlots {
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
    const requestedLocales = ((Intl as any)
      .getCanonicalLocales as typeof getCanonicalLocales)(locales);
    const opt: any = Object.create(null);
    const opts =
      options === undefined ? Object.create(null) : ToObject(options);
    const internalSlots = getInternalSlots(this);
    internalSlots.initializedPluralRules = true;
    const matcher = GetOption(
      opts,
      'localeMatcher',
      'string',
      ['best fit', 'lookup'],
      'best fit'
    );
    opt.localeMatcher = matcher;
    internalSlots.type = GetOption(
      opts,
      'type',
      'string',
      ['cardinal', 'ordinal'],
      'cardinal'
    );

    SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard');
    const r = ResolveLocale(
      PluralRules.availableLocales,
      requestedLocales,
      opt,
      PluralRules.relevantExtensionKeys,
      PluralRules.localeData,
      PluralRules.getDefaultLocale
    );
    internalSlots.locale = r.locale;
  }
  public resolvedOptions() {
    validateInstance(this, 'resolvedOptions');
    const opts = Object.create(null);
    const internalSlots = getInternalSlots(this);
    opts.locale = internalSlots.locale;
    opts.type = internalSlots.type;
    ([
      'minimumIntegerDigits',
      'minimumFractionDigits',
      'maximumFractionDigits',
      'minimumSignificantDigits',
      'maximumSignificantDigits',
    ] as Array<keyof PluralRulesInternal>).forEach(field => {
      const val = internalSlots[field];
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
    const internalSlots = getInternalSlots(this);
    const {type, locale} = internalSlots;

    return PluralRules.localeData[locale].fn(
      FormatNumericToString(getInternalSlots(this), Math.abs(Number(val)))
        .formattedString,
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
    return SupportedLocales(
      PluralRules.availableLocales,
      ((Intl as any).getCanonicalLocales as typeof getCanonicalLocales)(
        locales
      ),
      options
    );
  }
  public static __addLocaleData(...data: PluralRulesLocaleData[]) {
    for (const datum of data) {
      const availableLocales: string[] = datum.availableLocales;
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
}

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(PluralRules.prototype, Symbol.toStringTag, {
      value: 'Intl.PluralRules',
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

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
