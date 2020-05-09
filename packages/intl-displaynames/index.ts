import {
  getInternalSlot,
  setInternalSlot,
  getOption,
  getCanonicalLocales,
  createResolveLocale,
  invariant,
  supportedLocales,
  isWellFormedCurrencyCode,
  getMultiInternalSlots,
  DisplayNamesLocaleData,
  unpackData,
  DisplayNamesData,
  toString,
} from '@formatjs/intl-utils';

export interface DisplayNamesOptions {
  localeMatcher?: 'lookup' | 'best fit';
  style?: 'narrow' | 'short' | 'long';
  type?: 'language' | 'region' | 'script' | 'currency';
  fallback?: 'code' | 'none';
}

export interface DisplayNamesResolvedOptions {
  locale: string;
  style: NonNullable<DisplayNamesOptions['style']>;
  type: NonNullable<DisplayNamesOptions['type']>;
  fallback: NonNullable<DisplayNamesOptions['fallback']>;
}

export class DisplayNames {
  constructor(
    locales?: string | string[],
    options: DisplayNamesOptions = Object.create(null)
  ) {
    if (new.target === undefined) {
      throw TypeError(`Constructor Intl.DisplayNames requires 'new'`);
    }
    const requestedLocales = getCanonicalLocales(locales);

    const matcher = getOption(
      options!,
      'localeMatcher',
      'string',
      ['lookup', 'best fit'],
      'best fit'
    );

    const r = createResolveLocale(DisplayNames.getDefaultLocale)(
      DisplayNames.availableLocales,
      requestedLocales,
      {localeMatcher: matcher},
      [], // there is no relevantExtensionKeys
      DisplayNames.localeData
    );

    const style = getOption(
      options,
      'style',
      'string',
      ['narrow', 'short', 'long'],
      'long'
    );
    setSlot(this, 'style', style);

    const type = getOption(
      options,
      'type',
      'string',
      ['language', 'currency', 'region', 'script'],
      'language'
    );
    setSlot(this, 'type', type);

    const fallback = getOption(
      options,
      'fallback',
      'string',
      ['code', 'none'],
      'code'
    );
    setSlot(this, 'fallback', fallback);
    setSlot(this, 'locale', r.locale);

    const {dataLocale} = r;
    const dataLocaleData = DisplayNames.localeData[dataLocale];
    invariant(
      dataLocaleData !== undefined,
      `locale data for ${r.locale} does not exist.`
    );
    setSlot(this, 'localeData', dataLocaleData);
  }

  static supportedLocalesOf(
    locales?: string | string[],
    options?: Pick<DisplayNamesOptions, 'localeMatcher'>
  ) {
    return supportedLocales(
      DisplayNames.availableLocales,
      getCanonicalLocales(locales),
      options
    );
  }

  static __addLocaleData(...data: DisplayNamesLocaleData[]) {
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
      for (const locale of availableLocales) {
        try {
          DisplayNames.localeData[locale] = unpackData(locale, datum);
        } catch (e) {
          // If we can't unpack this data, ignore the locale
        }
      }
    }
    DisplayNames.availableLocales = Object.keys(DisplayNames.localeData);
    if (!DisplayNames.__defaultLocale) {
      DisplayNames.__defaultLocale = DisplayNames.availableLocales[0];
    }
  }

  of(code: string | number | object): string | undefined {
    checkReceiver(this, 'of');
    const type = getSlot(this, 'type');
    const codeAsString = toString(code);
    if (!isValidCodeForDisplayNames(type, codeAsString)) {
      throw RangeError('invalid code for Intl.DisplayNames.prototype.of');
    }
    const {localeData, style, fallback} = getMultiInternalSlots(
      __INTERNAL_SLOT_MAP__,
      this,
      'localeData',
      'style',
      'fallback'
    );

    // Canonicalize the case.
    let canonicalCode: string;
    // This is only used to store extracted language region.
    let regionSubTag: string | undefined;
    switch (type) {
      // Normalize the locale id and remove the region.
      case 'language': {
        canonicalCode = getCanonicalLocales(codeAsString)[0];
        const regionMatch = /-([a-z]{2}|\d{3})\b/i.exec(canonicalCode);
        if (regionMatch) {
          // Remove region subtag
          canonicalCode =
            canonicalCode.substring(0, regionMatch.index) +
            canonicalCode.substring(regionMatch.index + regionMatch[0].length);
          regionSubTag = regionMatch[1];
        }
        break;
      }
      // currency code should be all upper-case.
      case 'currency':
        canonicalCode = codeAsString.toUpperCase();
        break;
      // script code should be title case
      case 'script':
        canonicalCode =
          codeAsString[0] + codeAsString.substring(1).toLowerCase();
        break;
      // region shold be all upper-case
      case 'region':
        canonicalCode = codeAsString.toUpperCase();
        break;
    }

    const typesData = localeData.types[type];
    // If the style of choice does not exist, fallback to "long".
    const name =
      typesData[style][canonicalCode] || typesData.long[canonicalCode];

    if (name !== undefined) {
      // If there is a region subtag in the language id, use locale pattern to interpolate the region
      if (regionSubTag) {
        // Retrieve region display names
        const regionsData = localeData.types.region;
        const regionDisplayName: string | undefined =
          regionsData[style][regionSubTag] || regionsData.long[regionSubTag];

        if (regionDisplayName || fallback === 'code') {
          // Interpolate into locale-specific pattern.
          const pattern = localeData.patterns.locale;
          return pattern
            .replace('{0}', name)
            .replace('{1}', regionDisplayName || regionSubTag);
        }
      } else {
        return name;
      }
    }

    if (fallback === 'code') {
      return codeAsString;
    }
  }

  resolvedOptions(): DisplayNamesResolvedOptions {
    checkReceiver(this, 'resolvedOptions');
    return {
      ...getMultiInternalSlots(
        __INTERNAL_SLOT_MAP__,
        this,
        'locale',
        'style',
        'type',
        'fallback'
      ),
    };
  }

  static localeData: Record<string, DisplayNamesData> = {};
  private static availableLocales: string[] = [];
  private static __defaultLocale = 'en';
  private static getDefaultLocale() {
    return DisplayNames.__defaultLocale;
  }
  public static readonly polyfilled = true;
}

// https://tc39.es/proposal-intl-displaynames/#sec-isvalidcodefordisplaynames
function isValidCodeForDisplayNames(
  type: NonNullable<DisplayNamesOptions['type']>,
  code: string
): boolean {
  switch (type) {
    case 'language':
      // subset of unicode_language_id
      // languageCode ["-" scriptCode] ["-" regionCode] *("-" variant)
      // where:
      // - languageCode is either a two letters ISO 639-1 language code or a three letters ISO 639-2 language code.
      // - scriptCode is should be an ISO-15924 four letters script code
      // - regionCode is either an ISO-3166 two letters region code, or a three digits UN M49 Geographic Regions.
      return /^[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?(-([a-z\d]{5,8}|\d[a-z\d]{3}))*$/i.test(
        code
      );
    case 'region':
      // unicode_region_subtag
      return /^([a-z]{2}|\d{3})$/i.test(code);
    case 'script':
      // unicode_script_subtag
      return /^[a-z]{4}$/i.test(code);
    case 'currency':
      return isWellFormedCurrencyCode(code);
  }
}

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(DisplayNames.prototype, Symbol.toStringTag, {
      value: 'Intl.DisplayNames',
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }
  Object.defineProperty(DisplayNames, 'length', {
    value: 0,
    writable: false,
    enumerable: false,
    configurable: true,
  });
} catch (e) {
  // Make test 262 compliant
}

interface DisplayNamesInternalSlots {
  locale: string;
  style: NonNullable<DisplayNamesOptions['style']>;
  type: NonNullable<DisplayNamesOptions['type']>;
  fallback: NonNullable<DisplayNamesOptions['fallback']>;
  // Note that this differs from `fields` slot in the spec.
  localeData: DisplayNamesData;
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<
  DisplayNames,
  DisplayNamesInternalSlots
>();

function getSlot<K extends keyof DisplayNamesInternalSlots>(
  instance: DisplayNames,
  key: K
): DisplayNamesInternalSlots[K] {
  return getInternalSlot(__INTERNAL_SLOT_MAP__, instance, key);
}

function setSlot<K extends keyof DisplayNamesInternalSlots>(
  instance: DisplayNames,
  key: K,
  value: DisplayNamesInternalSlots[K]
): void {
  setInternalSlot(__INTERNAL_SLOT_MAP__, instance, key, value);
}

function checkReceiver(receiver: unknown, methodName: string) {
  if (!(receiver instanceof DisplayNames)) {
    throw TypeError(
      `Method Intl.DisplayNames.prototype.${methodName} called on incompatible receiver`
    );
  }
}
