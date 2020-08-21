import {RawNumberFormatResult} from '../../types/number';
import {repeat} from '../utils';

/**
 * TODO: dedup with intl-pluralrules and support BigInt
 * https://tc39.es/ecma402/#sec-torawfixed
 * @param x a finite non-negative Number or BigInt
 * @param minFraction and integer between 0 and 20
 * @param maxFraction and integer between 0 and 20
 */
export function ToRawFixed(
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
