import aliases from './aliases';
import parentLocales from './parentLocales';
import {invariant} from './invariant';
import {
  NumberFormatDigitInternalSlots,
  NumberFormatDigitOptions,
} from './number-types';

/**
 * https://tc39.es/ecma262/#sec-toobject
 * @param arg
 */
export function toObject<T>(
  arg: T
): T extends null ? never : T extends undefined ? never : T {
  if (arg == null) {
    throw new TypeError('undefined/null cannot be converted to object');
  }
  return Object(arg);
}

/**
 * https://tc39.es/ecma262/#sec-tostring
 */
export function toString(o: unknown): string {
  // Only symbol is irregular...
  if (typeof o === 'symbol') {
    throw TypeError('Cannot convert a Symbol value to a string');
  }
  return String(o);
}

/**
 * https://tc39.es/ecma402/#sec-getoption
 * @param opts
 * @param prop
 * @param type
 * @param values
 * @param fallback
 */
export function getOption<T extends object, K extends keyof T, F>(
  opts: T,
  prop: K,
  type: 'string' | 'boolean',
  values: T[K][] | undefined,
  fallback: F
): Exclude<T[K], undefined> | F {
  // const descriptor = Object.getOwnPropertyDescriptor(opts, prop);
  let value: any = opts[prop];
  if (value !== undefined) {
    if (type !== 'boolean' && type !== 'string') {
      throw new TypeError('invalid type');
    }
    if (type === 'boolean') {
      value = Boolean(value);
    }
    if (type === 'string') {
      value = toString(value);
    }
    if (values !== undefined && !values.filter(val => val == value).length) {
      throw new RangeError(`${value} is not within ${values.join(', ')}`);
    }
    return value;
  }
  return fallback;
}

/**
 * https://tc39.es/ecma402/#sec-defaultnumberoption
 * @param val
 * @param min
 * @param max
 * @param fallback
 */
export function defaultNumberOption(
  val: any,
  min: number,
  max: number,
  fallback: number
) {
  if (val !== undefined) {
    val = Number(val);
    if (isNaN(val) || val < min || val > max) {
      throw new RangeError(`${val} is outside of range [${min}, ${max}]`);
    }
    return Math.floor(val);
  }
  return fallback;
}

/**
 * https://tc39.es/ecma402/#sec-getnumberoption
 * @param options
 * @param property
 * @param min
 * @param max
 * @param fallback
 */

export function getNumberOption<T extends object, K extends keyof T>(
  options: T,
  property: K,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  const val = options[property];
  return defaultNumberOption(val, minimum, maximum, fallback);
}

export function getAliasesByLang(lang: string): Record<string, string> {
  return Object.keys(aliases).reduce((all: Record<string, string>, locale) => {
    if (locale.split('-')[0] === lang) {
      all[locale] = aliases[locale as 'zh-CN'];
    }
    return all;
  }, {});
}

export function getParentLocalesByLang(lang: string): Record<string, string> {
  return Object.keys(parentLocales).reduce(
    (all: Record<string, string>, locale) => {
      if (locale.split('-')[0] === lang) {
        all[locale] = parentLocales[locale as 'en-150'];
      }
      return all;
    },
    {}
  );
}

export function setInternalSlot<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  field: Field,
  value: NonNullable<Internal>[Field]
) {
  if (!map.get(pl)) {
    map.set(pl, Object.create(null));
  }
  const slots = map.get(pl)!;
  slots[field] = value;
}

export function setMultiInternalSlots<
  Instance extends object,
  Internal extends object,
  K extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  props: Pick<NonNullable<Internal>, K>
) {
  for (const k of Object.keys(props) as K[]) {
    setInternalSlot(map, pl, k, props[k]);
  }
}

export function getInternalSlot<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  field: Field
): Internal[Field] {
  return getMultiInternalSlots(map, pl, field)[field];
}

export function getMultiInternalSlots<
  Instance extends object,
  Internal extends object,
  Field extends keyof Internal
>(
  map: WeakMap<Instance, Internal>,
  pl: Instance,
  ...fields: Field[]
): Pick<Internal, Field> {
  const slots = map.get(pl);
  if (!slots) {
    throw new TypeError(`${pl} InternalSlot has not been initialized`);
  }
  return fields.reduce((all, f) => {
    all[f] = slots[f];
    return all;
  }, Object.create(null) as Pick<Internal, Field>);
}

export interface LiteralPart {
  type: 'literal';
  value: string;
}

export function isLiteralPart(
  patternPart: LiteralPart | {type: string; value?: string}
): patternPart is LiteralPart {
  return patternPart.type === 'literal';
}

export function partitionPattern(pattern: string) {
  const result = [];
  let beginIndex = pattern.indexOf('{');
  let endIndex = 0;
  let nextIndex = 0;
  const length = pattern.length;
  while (beginIndex < pattern.length && beginIndex > -1) {
    endIndex = pattern.indexOf('}', beginIndex);
    invariant(endIndex > beginIndex, `Invalid pattern ${pattern}`);
    if (beginIndex > nextIndex) {
      result.push({
        type: 'literal',
        value: pattern.substring(nextIndex, beginIndex),
      });
    }
    result.push({
      type: pattern.substring(beginIndex + 1, endIndex),
      value: undefined,
    });
    nextIndex = endIndex + 1;
    beginIndex = pattern.indexOf('{', nextIndex);
  }
  if (nextIndex < length) {
    result.push({
      type: 'literal',
      value: pattern.substring(nextIndex, length),
    });
  }
  return result;
}

/**
 * https://tc39.es/ecma402/#sec-setnfdigitoptions
 * https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_diff_out.html#sec-setnfdigitoptions
 * @param intlObj
 * @param opts
 * @param mnfdDefault
 * @param mxfdDefault
 */
export function setNumberFormatDigitOptions<
  TObject extends object,
  TInternalSlots extends NumberFormatDigitInternalSlots
>(
  internalSlotMap: WeakMap<TObject, TInternalSlots>,
  intlObj: TObject,
  opts: NumberFormatDigitOptions,
  mnfdDefault: number,
  mxfdDefault: number
) {
  const mnid = getNumberOption(opts, 'minimumIntegerDigits', 1, 21, 1);
  let mnfd = opts.minimumFractionDigits;
  let mxfd = opts.maximumFractionDigits;
  let mnsd = opts.minimumSignificantDigits;
  let mxsd = opts.maximumSignificantDigits;
  setInternalSlot(internalSlotMap, intlObj, 'minimumIntegerDigits', mnid);
  if (mnsd !== undefined || mxsd !== undefined) {
    setInternalSlot(
      internalSlotMap,
      intlObj,
      'roundingType',
      'significantDigits'
    );
    mnsd = defaultNumberOption(mnsd, 1, 21, 1);
    mxsd = defaultNumberOption(mxsd, mnsd, 21, 21);
    setInternalSlot(internalSlotMap, intlObj, 'minimumSignificantDigits', mnsd);
    setInternalSlot(internalSlotMap, intlObj, 'maximumSignificantDigits', mxsd);
  } else if (mnfd !== undefined || mxfd !== undefined) {
    setInternalSlot(internalSlotMap, intlObj, 'roundingType', 'fractionDigits');
    mnfd = defaultNumberOption(mnfd, 0, 20, mnfdDefault);
    const mxfdActualDefault = Math.max(mnfd, mxfdDefault);
    mxfd = defaultNumberOption(mxfd, mnfd, 20, mxfdActualDefault);
    setInternalSlot(internalSlotMap, intlObj, 'minimumFractionDigits', mnfd);
    setInternalSlot(internalSlotMap, intlObj, 'maximumFractionDigits', mxfd);
  } else if (
    getInternalSlot(internalSlotMap, intlObj, 'notation') === 'compact'
  ) {
    setInternalSlot(
      internalSlotMap,
      intlObj,
      'roundingType',
      'compactRounding'
    );
  } else {
    setInternalSlot(internalSlotMap, intlObj, 'roundingType', 'fractionDigits');
    setInternalSlot(
      internalSlotMap,
      intlObj,
      'minimumFractionDigits',
      mnfdDefault
    );
    setInternalSlot(
      internalSlotMap,
      intlObj,
      'maximumFractionDigits',
      mxfdDefault
    );
  }
}

export function objectIs(x: any, y: any) {
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

const NOT_A_Z_REGEX = /[^A-Z]/;

/**
 * This follows https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
 * @param str string to convert
 */
function toUpperCase(str: string): string {
  return str.replace(/([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_proposed_out.html#sec-iswellformedcurrencycode
 * @param currency
 */
export function isWellFormedCurrencyCode(currency: string): boolean {
  currency = toUpperCase(currency);
  if (currency.length !== 3) {
    return false;
  }
  if (NOT_A_Z_REGEX.test(currency)) {
    return false;
  }
  return true;
}
