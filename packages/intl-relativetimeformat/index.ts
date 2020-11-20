import {
  SupportedLocales,
  RelativeTimeLocaleData,
  LocaleFieldsData,
  IntlRelativeTimeFormatOptions,
  ResolvedIntlRelativeTimeFormatOptions,
  PartitionRelativeTimePattern,
  RelativeTimePart,
  RelativeTimeFormattableUnit,
  InitializeRelativeTimeFormat,
  CanonicalizeLocaleList,
  ToString,
} from '@formatjs/ecma402-abstract';

import getInternalSlots from './get_internal_slots';

export default class RelativeTimeFormat {
  constructor(
    locales?: string | string[],
    options?: IntlRelativeTimeFormatOptions
  ) {
    // test262/test/intl402/RelativeTimeFormat/constructor/constructor/newtarget-undefined.js
    // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
    const newTarget =
      this && this instanceof RelativeTimeFormat ? this.constructor : void 0;
    if (!newTarget) {
      throw new TypeError("Intl.RelativeTimeFormat must be called with 'new'");
    }
    return InitializeRelativeTimeFormat(this, locales, options, {
      getInternalSlots,
      availableLocales: RelativeTimeFormat.availableLocales,
      relevantExtensionKeys: RelativeTimeFormat.relevantExtensionKeys,
      localeData: RelativeTimeFormat.localeData,
      getDefaultLocale: RelativeTimeFormat.getDefaultLocale,
    });
  }
  format(value: number, unit: RelativeTimeFormattableUnit): string {
    if (typeof this !== 'object') {
      throw new TypeError('format was called on a non-object');
    }
    const internalSlots = getInternalSlots(this);
    if (!internalSlots.initializedRelativeTimeFormat) {
      throw new TypeError('format was called on a invalid context');
    }
    return PartitionRelativeTimePattern(
      this,
      Number(value),
      ToString(unit) as RelativeTimeFormattableUnit,
      {
        getInternalSlots,
      }
    )
      .map(el => el.value)
      .join('');
  }
  formatToParts(
    value: number,
    unit: RelativeTimeFormattableUnit
  ): RelativeTimePart[] {
    if (typeof this !== 'object') {
      throw new TypeError('formatToParts was called on a non-object');
    }
    const internalSlots = getInternalSlots(this);
    if (!internalSlots.initializedRelativeTimeFormat) {
      throw new TypeError('formatToParts was called on a invalid context');
    }
    return PartitionRelativeTimePattern(
      this,
      Number(value),
      ToString(unit) as RelativeTimeFormattableUnit,
      {getInternalSlots}
    );
  }

  resolvedOptions(): ResolvedIntlRelativeTimeFormatOptions {
    if (typeof this !== 'object') {
      throw new TypeError('resolvedOptions was called on a non-object');
    }
    const internalSlots = getInternalSlots(this);
    if (!internalSlots.initializedRelativeTimeFormat) {
      throw new TypeError('resolvedOptions was called on a invalid context');
    }

    // test262/test/intl402/RelativeTimeFormat/prototype/resolvedOptions/type.js
    return {
      locale: internalSlots.locale,
      style: internalSlots.style,
      numeric: internalSlots.numeric,
      numberingSystem: internalSlots.numberingSystem,
    };
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<IntlRelativeTimeFormatOptions, 'localeMatcher'>
  ): string[] {
    return SupportedLocales(
      RelativeTimeFormat.availableLocales,
      CanonicalizeLocaleList(locales),
      options
    );
  }

  public static __addLocaleData(...data: RelativeTimeLocaleData[]): void {
    for (const {data: d, locale} of data) {
      const minimizedLocale = new (Intl as any).Locale(locale)
        .minimize()
        .toString();
      RelativeTimeFormat.localeData[locale] = RelativeTimeFormat.localeData[
        minimizedLocale
      ] = d;
      RelativeTimeFormat.availableLocales.add(minimizedLocale);
      RelativeTimeFormat.availableLocales.add(locale);
      if (!RelativeTimeFormat.__defaultLocale) {
        RelativeTimeFormat.__defaultLocale = minimizedLocale;
      }
    }
  }
  static localeData: Record<string, LocaleFieldsData> = {};
  private static availableLocales = new Set<string>();
  private static __defaultLocale = '';
  private static getDefaultLocale() {
    return RelativeTimeFormat.__defaultLocale;
  }
  private static relevantExtensionKeys = ['nu'];
  public static polyfilled = true;
}

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(RelativeTimeFormat.prototype, Symbol.toStringTag, {
      value: 'Intl.RelativeTimeFormat',
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  // https://github.com/tc39/test262/blob/master/test/intl402/RelativeTimeFormat/constructor/length.js
  Object.defineProperty(RelativeTimeFormat.prototype.constructor, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  // https://github.com/tc39/test262/blob/master/test/intl402/RelativeTimeFormat/constructor/supportedLocalesOf/length.js
  Object.defineProperty(RelativeTimeFormat.supportedLocalesOf, 'length', {
    value: 1,
    writable: false,
    enumerable: false,
    configurable: true,
  });
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}
