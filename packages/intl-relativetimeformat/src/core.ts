import {Unit, FormattableUnit} from './types';
import {
  toObject,
  getOption,
  getLocaleHierarchy,
  supportedLocales,
  RelativeTimeLocaleData,
  getCanonicalLocales,
  createResolveLocale,
  UnpackedLocaleFieldsData,
  setInternalSlot,
  getInternalSlot,
  invariant,
  RelativeTimeField,
  FieldData,
  LDMLPluralRule,
  partitionPattern,
  isLiteralPart,
  LiteralPart,
} from '@formatjs/intl-utils';

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

export interface RelativeTimeFormatNumberPart extends Intl.NumberFormatPart {
  unit: Unit;
}

function unpackData(locale: string, localeData: RelativeTimeLocaleData) {
  const localeHierarchy = getLocaleHierarchy(
    locale,
    localeData.aliases,
    localeData.parentLocales
  );
  const dataToMerge = localeHierarchy
    .map(l => localeData.data[l])
    .filter(Boolean);
  if (!dataToMerge.length) {
    throw new Error(
      `Missing locale data for "${locale}", lookup hierarchy: ${localeHierarchy.join(
        ', '
      )}`
    );
  }
  dataToMerge.reverse();
  return dataToMerge.reduce(
    (all: UnpackedLocaleFieldsData, d) => ({
      ...all,
      ...d,
    }),
    {nu: []}
  );
}

/**
 * https://tc39.es/proposal-intl-relative-time/#sec-singularrelativetimeunit
 * @param unit
 */
function singularRelativeTimeUnit(unit: FormattableUnit): Unit {
  invariant(
    typeof unit === 'string',
    `unit must be a string, instead got ${typeof unit}`,
    TypeError
  );
  if (unit === 'seconds') return 'second';
  if (unit === 'minutes') return 'minute';
  if (unit === 'hours') return 'hour';
  if (unit === 'days') return 'day';
  if (unit === 'weeks') return 'week';
  if (unit === 'months') return 'month';
  if (unit === 'quarters') return 'quarter';
  if (unit === 'years') return 'year';
  if (
    unit !== 'second' &&
    unit !== 'minute' &&
    unit !== 'hour' &&
    unit !== 'day' &&
    unit !== 'week' &&
    unit !== 'month' &&
    unit !== 'quarter' &&
    unit !== 'year'
  ) {
    throw new RangeError(`Invalid unit ${unit}`);
  }
  return unit;
}

const NUMBERING_SYSTEM_REGEX = /^[a-z0-9]{3,8}(-[a-z0-9]{3,8})*$/i;

interface RelativeTimeFormatInternal {
  numberFormat: Intl.NumberFormat;
  pluralRules: Intl.PluralRules;
  locale: string;
  fields: UnpackedLocaleFieldsData;
  style: IntlRelativeTimeFormatOptions['style'];
  numeric: IntlRelativeTimeFormatOptions['numeric'];
  numberingSystem: string;
  initializedRelativeTimeFormat: boolean;
}

/**
 * https://tc39.es/proposal-intl-relative-time/#sec-makepartslist
 * @param pattern
 * @param unit
 * @param parts
 */
function makePartsList(
  pattern: string,
  unit: Unit,
  parts: Intl.NumberFormatPart[]
): Part[] {
  const patternParts = partitionPattern(pattern);
  const result: Part[] = [];
  for (const patternPart of patternParts) {
    if (isLiteralPart(patternPart)) {
      result.push({
        type: 'literal',
        value: patternPart.value,
      });
    } else {
      invariant(patternPart.type === '0', `Malformed pattern ${pattern}`);
      for (const part of parts) {
        result.push({
          type: part.type,
          value: part.value,
          unit,
        });
      }
    }
  }
  return result;
}

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

function toString(arg: any): string {
  return arg + '';
}

/**
 * PartitionRelativeTimePattern
 * @param rtf
 * @param value
 * @param unit
 */
function partitionRelativeTimePattern(
  internalSlotMap: WeakMap<RelativeTimeFormat, RelativeTimeFormatInternal>,
  rtf: RelativeTimeFormat,
  value: number,
  unit: FormattableUnit
): Part[] {
  invariant(
    typeof value === 'number',
    `value must be number, instead got ${typeof value}`,
    TypeError
  );
  invariant(
    typeof unit === 'string',
    `unit must be number, instead got ${typeof value}`,
    TypeError
  );
  if (isNaN(value) || value === Infinity || value === -Infinity) {
    throw new RangeError(`Invalid value ${value}`);
  }
  const resolvedUnit = singularRelativeTimeUnit(unit);
  const fields = getInternalSlot(internalSlotMap, rtf, 'fields');
  const style = getInternalSlot(internalSlotMap, rtf, 'style');
  let entry: RelativeTimeField = resolvedUnit;
  if (style === 'short') {
    entry = `${unit}-short` as RelativeTimeField;
  } else if (style === 'narrow') {
    entry = `${unit}-narrow` as RelativeTimeField;
  }
  if (!(entry in fields)) {
    entry = unit as RelativeTimeField;
  }
  const patterns = fields[entry]!;
  const numeric = getInternalSlot(internalSlotMap, rtf, 'numeric');
  if (numeric === 'auto') {
    if (toString(value) in patterns) {
      return [
        {
          type: 'literal',
          value: patterns[toString(value) as '-1']!,
        },
      ];
    }
  }
  let tl: keyof FieldData = 'future';
  if (objectIs(value, -0) || value < 0) {
    tl = 'past';
  }
  const po = patterns[tl];
  const pluralRules = getInternalSlot(internalSlotMap, rtf, 'pluralRules');
  const numberFormat = getInternalSlot(internalSlotMap, rtf, 'numberFormat');
  const fv =
    typeof numberFormat.formatToParts === 'function'
      ? numberFormat.formatToParts(Math.abs(value))
      : // TODO: If formatToParts is not supported, we assume the whole formatted
        // number is a part
        [
          {
            type: 'literal',
            value: numberFormat.format(Math.abs(value)),
            unit,
          } as RelativeTimeFormatNumberPart,
        ];
  const pr = pluralRules.select(value) as LDMLPluralRule;
  const pattern = po[pr];
  return makePartsList(pattern!, resolvedUnit, fv);
}

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
    setInternalSlot(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      'initializedRelativeTimeFormat',
      true
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
    const numberingSystem: string = getOption(
      opts,
      'numberingSystem',
      'string',
      undefined,
      undefined
    );
    if (numberingSystem !== undefined) {
      if (!NUMBERING_SYSTEM_REGEX.test(numberingSystem)) {
        throw new RangeError(`Invalid numbering system ${numberingSystem}`);
      }
    }
    opt.nu = numberingSystem;
    const r = createResolveLocale(RelativeTimeFormat.getDefaultLocale)(
      RelativeTimeFormat.availableLocales,
      requestedLocales,
      opt,
      RelativeTimeFormat.relevantExtensionKeys,
      RelativeTimeFormat.localeData
    );
    const {locale, nu} = r;
    setInternalSlot(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      'locale',
      locale
    );
    setInternalSlot(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      'style',
      getOption(opts, 'style', 'string', ['long', 'narrow', 'short'], 'long')
    );
    setInternalSlot(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      'numeric',
      getOption(opts, 'numeric', 'string', ['always', 'auto'], 'always')
    );
    setInternalSlot(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      'fields',
      RelativeTimeFormat.localeData[locale]
    );
    setInternalSlot(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      'numberFormat',
      new Intl.NumberFormat(locales)
    );
    setInternalSlot(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      'pluralRules',
      new Intl.PluralRules(locales)
    );
    setInternalSlot(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      'numberingSystem',
      nu
    );
  }
  format(value: number, unit: FormattableUnit): string {
    if (typeof this !== 'object') {
      throw new TypeError('format was called on a non-object');
    }
    if (
      !getInternalSlot(
        RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
        this,
        'initializedRelativeTimeFormat'
      )
    ) {
      throw new TypeError('format was called on a invalid context');
    }
    return partitionRelativeTimePattern(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      Number(value),
      toString(unit) as FormattableUnit
    )
      .map(el => el.value)
      .join('');
  }
  formatToParts(value: number, unit: FormattableUnit): Part[] {
    if (typeof this !== 'object') {
      throw new TypeError('formatToParts was called on a non-object');
    }
    if (
      !getInternalSlot(
        RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
        this,
        'initializedRelativeTimeFormat'
      )
    ) {
      throw new TypeError('formatToParts was called on a invalid context');
    }
    return partitionRelativeTimePattern(
      RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
      this,
      Number(value),
      toString(unit) as FormattableUnit
    );
  }

  resolvedOptions(): ResolvedIntlRelativeTimeFormatOptions {
    if (typeof this !== 'object') {
      throw new TypeError('resolvedOptions was called on a non-object');
    }
    if (
      !getInternalSlot(
        RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
        this,
        'initializedRelativeTimeFormat'
      )
    ) {
      throw new TypeError('resolvedOptions was called on a invalid context');
    }

    // test262/test/intl402/RelativeTimeFormat/prototype/resolvedOptions/type.js
    return {
      locale: getInternalSlot(
        RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
        this,
        'locale'
      ),
      style: getInternalSlot(
        RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
        this,
        'style'
      ),
      numeric: getInternalSlot(
        RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
        this,
        'numeric'
      ),
      numberingSystem: getInternalSlot(
        RelativeTimeFormat.__INTERNAL_SLOT_MAP__,
        this,
        'numberingSystem'
      ),
    };
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<IntlRelativeTimeFormatOptions, 'localeMatcher'>
  ) {
    return supportedLocales(
      RelativeTimeFormat.availableLocales,
      getCanonicalLocales(locales),
      options
    );
  }

  public static __addLocaleData(...data: RelativeTimeLocaleData[]) {
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
          RelativeTimeFormat.localeData[locale] = unpackData(locale, datum);
        } catch (e) {
          // If we can't unpack this data, ignore the locale
        }
      });
    }
    RelativeTimeFormat.availableLocales = Object.keys(
      RelativeTimeFormat.localeData
    );
    if (!RelativeTimeFormat.__defaultLocale) {
      RelativeTimeFormat.__defaultLocale =
        RelativeTimeFormat.availableLocales[0];
    }
  }
  static localeData: Record<string, UnpackedLocaleFieldsData> = {};
  private static availableLocales: string[] = [];
  private static __defaultLocale = 'en';
  private static getDefaultLocale() {
    return RelativeTimeFormat.__defaultLocale;
  }
  private static relevantExtensionKeys = ['nu'];
  public static polyfilled = true;
  private static readonly __INTERNAL_SLOT_MAP__ = new WeakMap<
    RelativeTimeFormat,
    RelativeTimeFormatInternal
  >();
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
