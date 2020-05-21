export interface RawNumberFormatResult {
  formattedString: string;
  roundedNumber: number;
  integerDigitsCount: number;
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

// TODO: dedup with intl-pluralrules
// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-torawfixed
export function toRawFixed(
  x: number,
  minFraction: number,
  maxFraction: number
): RawNumberFormatResult {
  const f = maxFraction;
  let n: number;
  {
    const exactSolve = x * 10 ** f;
    const roundDown = Math.floor(exactSolve);
    const roundUp = Math.ceil(exactSolve);
    n = exactSolve - roundDown < roundUp - exactSolve ? roundDown : roundUp;
  }
  const xFinal = n / 10 ** f;

  // n is a positive integer, but it is possible to be greater than 1e21.
  // In such case we will go the slow path.
  // See also: https://tc39.es/ecma262/#sec-numeric-types-number-tostring
  let m: string;
  if (n < 1e21) {
    m = n.toString();
  } else {
    m = n.toString();
    const idx1 = m.indexOf('.');
    const idx2 = m.indexOf('e+');
    const exponent = parseInt(m.substring(idx2 + 2), 10);
    m =
      m.substring(0, idx1) +
      m.substring(idx1 + 1, idx2) +
      repeat('0', exponent - (idx2 - idx1 - 1));
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

// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-torawprecision
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
    e = getMagnitude(x);
    let n: number;
    {
      const magnitude = e - p + 1;
      const exactSolve =
        // Preserve floating point precision as much as possible with multiplication.
        magnitude < 0 ? x * 10 ** -magnitude : x / 10 ** magnitude;
      const roundDown = Math.floor(exactSolve);
      const roundUp = Math.ceil(exactSolve);
      n = exactSolve - roundDown < roundUp - exactSolve ? roundDown : roundUp;
    }
    // See: https://tc39.es/ecma262/#sec-numeric-types-number-tostring
    // No need to worry about scientific notation because it only happens for values >= 1e21,
    // which has 22 significant digits. So it will at least be divided by 10 here to bring the
    // value back into non-scientific-notation range.
    m = n.toString();
    xFinal = n * 10 ** (e - p + 1);
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
