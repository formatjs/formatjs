import {invariant} from './invariant';
import {
  NumberFormatDigitInternalSlots,
  NumberFormatDigitOptions,
  NumberFormatNotation,
  RawNumberFormatResult,
} from './number-types';
import {SANCTIONED_UNITS} from './units';

export function hasOwnProperty(o: unknown, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, key);
}

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
 */
export function setNumberFormatDigitOptions(
  internalSlots: NumberFormatDigitInternalSlots,
  opts: NumberFormatDigitOptions,
  mnfdDefault: number,
  mxfdDefault: number,
  notation: NumberFormatNotation
) {
  const mnid = getNumberOption(opts, 'minimumIntegerDigits', 1, 21, 1);
  let mnfd = opts.minimumFractionDigits;
  let mxfd = opts.maximumFractionDigits;
  let mnsd = opts.minimumSignificantDigits;
  let mxsd = opts.maximumSignificantDigits;
  internalSlots.minimumIntegerDigits = mnid;
  if (mnsd !== undefined || mxsd !== undefined) {
    internalSlots.roundingType = 'significantDigits';
    mnsd = defaultNumberOption(mnsd, 1, 21, 1);
    mxsd = defaultNumberOption(mxsd, mnsd, 21, 21);
    internalSlots.minimumSignificantDigits = mnsd;
    internalSlots.maximumSignificantDigits = mxsd;
  } else if (mnfd !== undefined || mxfd !== undefined) {
    internalSlots.roundingType = 'fractionDigits';
    mnfd = defaultNumberOption(mnfd, 0, 20, mnfdDefault);
    const mxfdActualDefault = Math.max(mnfd, mxfdDefault);
    mxfd = defaultNumberOption(mxfd, mnfd, 20, mxfdActualDefault);
    internalSlots.minimumFractionDigits = mnfd;
    internalSlots.maximumFractionDigits = mxfd;
  } else if (notation === 'compact') {
    internalSlots.roundingType = 'compactRounding';
  } else {
    internalSlots.roundingType = 'fractionDigits';
    internalSlots.minimumFractionDigits = mnfdDefault;
    internalSlots.maximumFractionDigits = mxfdDefault;
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
 * https://tc39.es/ecma402/#sec-iswellformedcurrencycode
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

/**
 * https://tc39.es/ecma402/#sec-formatnumberstring
 * TODO: dedup with intl-pluralrules
 */
export function formatNumericToString(
  internalSlots: Pick<
    NumberFormatDigitInternalSlots,
    | 'roundingType'
    | 'minimumSignificantDigits'
    | 'maximumSignificantDigits'
    | 'minimumIntegerDigits'
    | 'minimumFractionDigits'
    | 'maximumFractionDigits'
  >,
  x: number
) {
  const isNegative = x < 0 || objectIs(x, -0);
  if (isNegative) {
    x = -x;
  }

  let result: RawNumberFormatResult;

  const rourndingType = internalSlots.roundingType;

  switch (rourndingType) {
    case 'significantDigits':
      result = toRawPrecision(
        x,
        internalSlots.minimumSignificantDigits!,
        internalSlots.maximumSignificantDigits!
      );
      break;
    case 'fractionDigits':
      result = toRawFixed(
        x,
        internalSlots.minimumFractionDigits!,
        internalSlots.maximumFractionDigits!
      );
      break;
    default:
      result = toRawPrecision(x, 1, 2);
      if (result.integerDigitsCount > 1) {
        result = toRawFixed(x, 0, 0);
      }
      break;
  }

  x = result.roundedNumber;
  let string = result.formattedString;
  const int = result.integerDigitsCount;
  const minInteger = internalSlots.minimumIntegerDigits;

  if (int < minInteger) {
    const forwardZeros = repeat('0', minInteger - int);
    string = forwardZeros + string;
  }

  if (isNegative) {
    x = -x;
  }
  return {roundedNumber: x, formattedString: string};
}

/**
 * TODO: dedup with intl-pluralrules and support BigInt
 * https://tc39.es/ecma402/#sec-torawfixed
 * @param x a finite non-negative Number or BigInt
 * @param minFraction and integer between 0 and 20
 * @param maxFraction and integer between 0 and 20
 */
export function toRawFixed(
  x: number,
  minFraction: number,
  maxFraction: number
): RawNumberFormatResult {
  const f = maxFraction;
  const n = Math.round(x * 10 ** f);
  const xFinal = n / 10 ** f;

  // n is a positive integer, but it is possible to be greater than 1e21.
  // In such case we will go the slow path.
  // See also: https://tc39.es/ecma262/#sec-numeric-types-number-tostring
  let m: string;
  if (n < 1e21) {
    m = n.toString();
  } else {
    m = n.toString();
    const [mantissa, exponent] = m.split('e');
    m = mantissa.replace('.', '');
    m = m + repeat('0', Math.max(+exponent - m.length + 1, 0));
  }
  let int: number;
  if (f !== 0) {
    let k = m.length;
    if (k <= f) {
      const z = repeat('0', f + 1 - k);
      m = z + m;
      k = f + 1;
    }
    const a = m.slice(0, k - f);
    const b = m.slice(k - f);
    m = `${a}.${b}`;
    int = a.length;
  } else {
    int = m.length;
  }
  let cut = maxFraction - minFraction;
  while (cut > 0 && m[m.length - 1] === '0') {
    m = m.slice(0, -1);
    cut--;
  }
  if (m[m.length - 1] === '.') {
    m = m.slice(0, -1);
  }
  return {formattedString: m, roundedNumber: xFinal, integerDigitsCount: int};
}

// https://tc39.es/ecma402/#sec-torawprecision
export function toRawPrecision(
  x: number,
  minPrecision: number,
  maxPrecision: number
): RawNumberFormatResult {
  const p = maxPrecision;
  let m: string;
  let e: number;
  let xFinal: number;
  if (x === 0) {
    m = repeat('0', p);
    e = 0;
    xFinal = 0;
  } else {
    const xToString = x.toString();
    // If xToString is formatted as scientific notation, the number is either very small or very
    // large. If the precision of the formatted string is lower that requested max precision, we
    // should still infer them from the formatted string, otherwise the formatted result might have
    // precision loss (e.g. 1e41 will not have 0 in every trailing digits).
    const xToStringExponentIndex = xToString.indexOf('e');
    const [xToStringMantissa, xToStringExponent] = xToString.split('e');
    const xToStringMantissaWithoutDecimalPoint = xToStringMantissa.replace(
      '.',
      ''
    );

    if (
      xToStringExponentIndex >= 0 &&
      xToStringMantissaWithoutDecimalPoint.length <= p
    ) {
      e = +xToStringExponent;
      m =
        xToStringMantissaWithoutDecimalPoint +
        repeat('0', p - xToStringMantissaWithoutDecimalPoint.length);
      xFinal = x;
    } else {
      e = getMagnitude(x);

      const decimalPlaceOffset = e - p + 1;
      // n is the integer containing the required precision digits. To derive the formatted string,
      // we will adjust its decimal place in the logic below.
      let n = Math.round(adjustDecimalPlace(x, decimalPlaceOffset));

      // The rounding caused the change of magnitude, so we should increment `e` by 1.
      if (adjustDecimalPlace(n, p - 1) >= 10) {
        e = e + 1;
        // Divide n by 10 to swallow one precision.
        n = Math.floor(n / 10);
      }

      m = n.toString();
      // Equivalent of n * 10 ** (e - p + 1)
      xFinal = adjustDecimalPlace(n, p - 1 - e);
    }
  }
  let int: number;
  if (e >= p - 1) {
    m = m + repeat('0', e - p + 1);
    int = e + 1;
  } else if (e >= 0) {
    m = `${m.slice(0, e + 1)}.${m.slice(e + 1)}`;
    int = e + 1;
  } else {
    m = `0.${repeat('0', -e - 1)}${m}`;
    int = 1;
  }
  if (m.indexOf('.') >= 0 && maxPrecision > minPrecision) {
    let cut = maxPrecision - minPrecision;
    while (cut > 0 && m[m.length - 1] === '0') {
      m = m.slice(0, -1);
      cut--;
    }
    if (m[m.length - 1] === '.') {
      m = m.slice(0, -1);
    }
  }
  return {formattedString: m, roundedNumber: xFinal, integerDigitsCount: int};

  // x / (10 ** magnitude), but try to preserve as much floating point precision as possible.
  function adjustDecimalPlace(x: number, magnitude: number): number {
    return magnitude < 0 ? x * 10 ** -magnitude : x / 10 ** magnitude;
  }
}

export function repeat(s: string, times: number): string {
  if (typeof s.repeat === 'function') {
    return s.repeat(times);
  }
  const arr = new Array(times);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = s;
  }
  return arr.join('');
}

/**
 * Cannot do Math.log(x) / Math.log(10) bc if IEEE floating point issue
 * @param x number
 */
export function getMagnitude(x: number): number {
  // Cannot count string length via Number.toString because it may use scientific notation
  // for very small or very large numbers.
  return Math.floor(Math.log(x) * Math.LOG10E);
}

/**
 * This follows https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
 * @param str string to convert
 */
function toLowerCase(str: string): string {
  return str.replace(/([A-Z])/g, (_, c) => c.toLowerCase());
}

const SHORTENED_SACTION_UNITS = SANCTIONED_UNITS.map(unit =>
  unit.replace(/^(.*?)-/, '')
);

/**
 * https://tc39.es/ecma402/#sec-iswellformedunitidentifier
 * @param unit
 */
export function isWellFormedUnitIdentifier(unit: string) {
  unit = toLowerCase(unit);
  if (SHORTENED_SACTION_UNITS.indexOf(unit) > -1) {
    return true;
  }
  const units = unit.split('-per-');
  if (units.length !== 2) {
    return false;
  }
  if (
    SHORTENED_SACTION_UNITS.indexOf(units[0]) < 0 ||
    SHORTENED_SACTION_UNITS.indexOf(units[1]) < 0
  ) {
    return false;
  }
  return true;
}

/*
  17 ECMAScript Standard Built-in Objects:
    Every built-in Function object, including constructors, that is not
    identified as an anonymous function has a name property whose value
    is a String.

    Unless otherwise specified, the name property of a built-in Function
    object, if it exists, has the attributes { [[Writable]]: false,
    [[Enumerable]]: false, [[Configurable]]: true }.
*/
export function defineProperty<T extends object>(
  target: T,
  name: string | symbol,
  {value}: {value: any} & ThisType<any>
) {
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: false,
    writable: true,
    value,
  });
}
