import formatToParts from '../src/format_to_parts';

function format(...args: Parameters<typeof formatToParts>): string {
  return formatToParts(...args)
    .map(({value}) => value)
    .join('');
}

const defaultOptions = {
  numberingSystem: 'latn',
  useGrouping: false,
  style: 'decimal',
  notation: 'standard',
} as const;

const baseNumberResult = {
  magnitude: 0,
  exponent: 0,
  sign: 0,
} as const;

it('formats decimal', () => {
  const data = require('../dist/locale-data/ja.json').data.ja;
  const pl = new Intl.PluralRules('ja');
  const n = {...baseNumberResult, formattedString: '1', roundedNumber: 1};
  expect(format(n, data, pl, defaultOptions)).toEqual('1');
  expect(format({...n, sign: -1}, data, pl, defaultOptions)).toEqual('-1');
  expect(format({...n, sign: 1}, data, pl, defaultOptions)).toEqual('+1');
});

it('formats percentage', () => {
  const options = {...defaultOptions, style: 'percent'} as const;
  const data = require('../dist/locale-data/ja.json').data.ja;
  const pl = new Intl.PluralRules('ja');
  const n = {...baseNumberResult, formattedString: '42', roundedNumber: 42};
  expect(format(n, data, pl, options)).toEqual('42%');
  expect(format({...n, sign: -1}, data, pl, options)).toEqual('-42%');
  expect(format({...n, sign: 1}, data, pl, options)).toEqual('+42%');
});

// Replicate Google Chrome's behavior: when there is a compact pattern, drop the percentage sign.
// For example, 10000 is formatted to "1M" (10000 * 100 = 1M).
it('formats percentage with compact display', () => {
  const options = {
    ...defaultOptions,
    style: 'percent',
    notation: 'compact',
    compactDisplay: 'short',
  } as const;
  const data = require('../dist/locale-data/en.json').data.en;
  const pl = new Intl.PluralRules('en-US');
  const n = {
    ...baseNumberResult,
    formattedString: '1',
    roundedNumber: 1,
    exponent: 6,
    magnitude: 6,
  };
  expect(format(n, data, pl, options)).toEqual('1M');
});

it('formats accounting currency sign pattern', () => {
  const options = {
    ...defaultOptions,
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'symbol',
    currencySign: 'accounting',
  } as const;
  const data = require('../dist/locale-data/ja.json').data.ja;
  const pl = new Intl.PluralRules('ja');
  const n = {...baseNumberResult, formattedString: '42', roundedNumber: 42};
  expect(format(n, data, pl, options)).toEqual('$42');
  expect(format({...n, sign: -1}, data, pl, options)).toEqual('($42)');
  expect(format({...n, sign: 1}, data, pl, options)).toEqual('+$42');
});

// For ar-SS, the currency symbol is after the number in arab numbering system,
// regardless standard or accounting currency sign.
// So -12 US dollar is formatted as "١٢٫٠٠ US$" (containing RTL control character!).
it('formats currency where the number precedes the symbol', () => {
  const options = {
    ...defaultOptions,
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'symbol',
    currencySign: 'accounting',
    numberingSystem: 'arab',
  } as const;
  const data = require('../dist/locale-data/ar-SS.json').data['ar-SS'];
  const pl = new Intl.PluralRules('ar-SS');
  const n = {...baseNumberResult, formattedString: '12', roundedNumber: 12};
  expect(format(n, data, pl, options)).toEqual('١٢\xa0US$');
  expect(format({...n, sign: -1}, data, pl, options)).toEqual('؜-١٢\xa0US$');
  expect(format({...n, sign: 1}, data, pl, options)).toEqual('؜+١٢\xa0US$');
});

// For ja locale, there is a non-breaking whitespace between currency's non-symbol character
// and digits. So formats 123 with USD code results in "USD 123". But formatting 123 with narrow
// symbol `$` results in "$123" because `$` as a symbol character does not match the rule.
it('respects currencyBefore insertion rule', () => {
  const options1 = {
    ...defaultOptions,
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
    currencySign: 'standard',
  } as const;
  const data = require('../dist/locale-data/ja.json').data.ja;
  const pl = new Intl.PluralRules('ja');
  const n = {...baseNumberResult, formattedString: '123', roundedNumber: 123};
  expect(format(n, data, pl, options1)).toEqual('USD\xa0123');
  expect(format({...n, sign: -1}, data, pl, options1)).toEqual('-USD\xa0123');
  expect(format({...n, sign: 1}, data, pl, options1)).toEqual('+USD\xa0123');

  const options2 = {...options1, currencyDisplay: 'narrowSymbol'} as const;
  expect(format(n, data, pl, options2)).toEqual('$123');
  expect(format({...n, sign: -1}, data, pl, options2)).toEqual('-$123');
  expect(format({...n, sign: 1}, data, pl, options2)).toEqual('+$123');
});

// For Bangali locale, the currency is after the number. We use `USD` and `$`
// respectively to test the spacing insertion rule. -123 USD dollars are formatted as follows:
// - code: -১২৩.০০ USD
// - narrow symbol: -১২৩.০০$
it('respects currencyAfter insertion rule', () => {
  const data = require('../dist/locale-data/bn.json').data.bn;
  const pl = new Intl.PluralRules('bn');
  const n = {
    ...baseNumberResult,
    formattedString: '123.00',
    roundedNumber: 123,
  };
  const options1 = {
    ...defaultOptions,
    style: 'currency',
    numberingSystem: 'beng',
    currency: 'USD',
    currencyDisplay: 'code',
    currencySign: 'standard',
  } as const;
  expect(format({...n, sign: -1}, data, pl, options1)).toEqual('-১২৩.০০ USD');

  const options2 = {...options1, currencyDisplay: 'narrowSymbol'} as const;
  expect(format({...n, sign: -1}, data, pl, options2)).toEqual('-১২৩.০০$');
});

// The same insertion rule also applies to currency compact display.
it('respects currencyAfter insertion rule for compact display', () => {
  const data = require('../dist/locale-data/en.json').data.en;
  const pl = new Intl.PluralRules('bn');
  const n = {
    ...baseNumberResult,
    formattedString: '10',
    roundedNumber: 10,
    exponent: 3,
    magnitude: 4,
  };
  const options = {
    ...defaultOptions,
    style: 'currency',
    currency: 'ZWD',
    currencyDisplay: 'narrowSymbol',
    currencySign: 'standard',
    notation: 'compact',
    compactDisplay: 'long',
  } as const;
  expect(format(n, data, pl, options)).toEqual('ZWD\xa010K');
});

// Celsius in Japanese has prefix and suffix surrounding the number.
// So -123 celsius degree is "摂氏 -123 度".
it('formats unit pattern with both prefix and suffix', () => {
  const options = {
    ...defaultOptions,
    style: 'unit',
    unit: 'celsius',
    unitDisplay: 'long',
  } as const;
  const data = require('../dist/locale-data/ja.json').data.ja;
  const pl = new Intl.PluralRules('ja');
  const n = {...baseNumberResult, formattedString: '123', roundedNumber: 123};
  expect(format(n, data, pl, options)).toEqual('摂氏 123 度');
  expect(format({...n, sign: -1}, data, pl, options)).toEqual('摂氏 -123 度');
  expect(format({...n, sign: 1}, data, pl, options)).toEqual('摂氏 +123 度');
});

// sw's currency unit pattern is "{1} {0}"
// So -123 USD is formatted as "dola za Marekani -123.00".
it('formats currency name pattern with currency before number', () => {
  const options = {
    ...defaultOptions,
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'name',
    currencySign: 'standard',
  } as const;
  const data = require('../dist/locale-data/sw.json').data.sw;
  const pl = new Intl.PluralRules('sw');
  const n = {
    ...baseNumberResult,
    formattedString: '123.00',
    roundedNumber: 123,
  };
  expect(format(n, data, pl, options)).toEqual('dola za Marekani 123.00');
  expect(format({...n, sign: -1}, data, pl, options)).toEqual(
    'dola za Marekani -123.00'
  );
  expect(format({...n, sign: 1}, data, pl, options)).toEqual(
    'dola za Marekani +123.00'
  );
});

// See also https://github.com/tc39/ecma402/issues/439
// sw's compact pattern can depend on style (currency vs. decimal) and sign (appears in the middle).
// -100 -> "elfu -100"
// -100 USD -> "US$laki -100"
it('formats compact notation that is currency and sign dependent', () => {
  const options1 = {
    ...defaultOptions,
    notation: 'compact',
    compactDisplay: 'long',
  } as const;
  const data = require('../dist/locale-data/sw.json').data.sw;
  const pl = new Intl.PluralRules('sw');
  const n = {
    ...baseNumberResult,
    formattedString: '100',
    roundedNumber: 100,
    magnitude: 5,
  };
  expect(format(n, data, pl, options1)).toEqual('elfu 100');
  expect(format({...n, sign: -1}, data, pl, options1)).toEqual('elfu -100');
  expect(format({...n, sign: 1}, data, pl, options1)).toEqual('elfu +100');

  const options2 = {
    ...options1,
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'symbol',
    currencySign: 'standard',
  } as const;
  expect(format(n, data, pl, options2)).toEqual('US$\xa0laki100');
  expect(format({...n, sign: -1}, data, pl, options2)).toEqual(
    'US$laki\xa0-100'
  );
  expect(format({...n, sign: 1}, data, pl, options2)).toEqual(
    'US$laki\xa0+100'
  );
});

// bn locale's compact part contains quoted period character.
// 100000000000000 should be formatted as "1000 লা.কো." (short comapct display).
it('properly unquotes characters from CLDR pattern', () => {
  const options = {
    ...defaultOptions,
    notation: 'compact',
    compactDisplay: 'short',
    numberingSystem: 'beng',
  } as const;
  const data = require('../dist/locale-data/bn.json').data.bn;
  const pl = new Intl.PluralRules('bn');
  const n = {
    ...baseNumberResult,
    formattedString: '1000',
    roundedNumber: 1000,
    magnitude: 14,
  };
  expect(format(n, data, pl, options)).toEqual('১০০০\xa0লা.কো.');
  expect(formatToParts(n, data, pl, options)).toEqual([
    {type: 'integer', value: '১০০০'},
    {type: 'literal', value: '\xa0'},
    {type: 'compact', value: 'লা.কো.'},
  ]);
});

// This might be a bug, bug we want to replicate Chrome and Node.js' behavior.
it('determines plurality of unit based on mantissa of the scientific notation', () => {
  const options = {
    ...defaultOptions,
    style: 'unit',
    unit: 'gallon',
    unitDisplay: 'long',
    notation: 'scientific',
  } as const;
  const data = require('../dist/locale-data/en-BS.json').data['en-BS'];
  const pl = new Intl.PluralRules('en-BS');
  const n = {
    ...baseNumberResult,
    formattedString: '1',
    roundedNumber: 1,
    magnitude: 4,
    exponent: 4,
  };
  expect(format(n, data, pl, options)).toEqual('1E4 US gallon');
});

// The plurality is NOT based on mantissa!
it('determines plurality of currency based on the number value of scientific notation', () => {
  const options = {
    ...defaultOptions,
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'name',
    notation: 'scientific',
  } as const;
  const data = require('../dist/locale-data/en-BS.json').data['en-BS'];
  const pl = new Intl.PluralRules('en-BS');
  const n = {
    ...baseNumberResult,
    formattedString: '1',
    roundedNumber: 1,
    magnitude: 4,
    exponent: 4,
  };
  expect(format(n, data, pl, options)).toEqual('1E4 US dollars');
});

// For de, the currency does not have "long" compact display pattern. Therefore, it falls back to
// use the decimal form, and then use that to interpolate the non-compact currency pattern.
// e.g. 10000 US dollars in long compact display form is -> "10 Tausend US-Dollar"
it('uses decimal compact pattern to format currency with currencyDisplay === "name"', () => {
  const options = {
    ...defaultOptions,
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'long',
    currencySign: 'accounting',
    currencyDisplay: 'name',
  } as const;
  const data = require('../dist/locale-data/de.json').data.de;
  const pl = new Intl.PluralRules('de');
  const n = {
    ...baseNumberResult,
    formattedString: '10',
    roundedNumber: 10,
    magnitude: 5,
    exponent: 4,
  };
  expect(format(n, data, pl, options)).toEqual('10 Tausend US-Dollar');
});

// "0" is special in CLDR compact pattern. It means that the number should fall back to be handled
// in non-compact form. For de, 10000 has "0" short compact pattern, so it should have grouping separator
// inserted when `useGrouping` is true.
it('falls back to non-compact formatting when the matching CLDR compact pattern is "0"', () => {
  const options = {
    ...defaultOptions,
    style: 'decimal',
    notation: 'compact',
    compactDisplay: 'short',
    useGrouping: true,
  } as const;
  const data = require('../dist/locale-data/de.json').data.de;
  const pl = new Intl.PluralRules('de');
  const n = {
    ...baseNumberResult,
    formattedString: '10000',
    roundedNumber: 10000,
    magnitude: 4,
  };
  expect(format(n, data, pl, options)).toEqual('10.000');
});

it('correctly handles NaN and Infinity in scientific notation', () => {
  const options = {...defaultOptions, notation: 'scientific'} as const;
  const data = require('../dist/locale-data/en.json').data.en;
  const pl = new Intl.PluralRules('en');
  const n1 = {
    ...baseNumberResult,
    formattedString: '∞',
    roundedNumber: Infinity,
  };
  expect(format(n1, data, pl, options)).toEqual('∞');
  const n2 = {
    ...baseNumberResult,
    formattedString: '∞',
    roundedNumber: -Infinity,
    sign: -1,
  } as const;
  expect(format(n2, data, pl, options)).toEqual('-∞');
  const n3 = {...baseNumberResult, formattedString: 'NaN', roundedNumber: NaN};
  expect(format(n3, data, pl, options)).toEqual('NaN');
});

// For ja, kilometer-per-hour exists as a simple pattern. So the short form is "km/h".
// If we use perUnitPattern to resolve this, it will become "km/時間".
it('formats compound unit that has the specialized pattern available', () => {
  const options = {
    ...defaultOptions,
    style: 'unit',
    unit: 'kilometer-per-hour',
    unitDisplay: 'short',
  } as const;
  const data = require('../dist/locale-data/ja.json').data.ja;
  const pl = new Intl.PluralRules('ja');
  const n = {...baseNumberResult, formattedString: '42', roundedNumber: 42};
  expect(format(n, data, pl, options)).toEqual('42 km/h');
});

// For ja, denominator unit "second" has perUnitPattern "{0}/秒",
// so 5 centimeters per second is "5センチメートル/秒" instead of "5 センチメートル毎秒".
it('formats compound unit that has perUnitPattern available', () => {
  const options = {
    ...defaultOptions,
    style: 'unit',
    unit: 'centimeter-per-second',
    unitDisplay: 'long',
  } as const;
  const data = require('../dist/locale-data/ja.json').data.ja;
  const pl = new Intl.PluralRules('ja');
  const n = {...baseNumberResult, formattedString: '5', roundedNumber: 5};
  expect(format(n, data, pl, options)).toEqual('5 センチメートル/秒');
});

// This is a weird test case but we are ensuring our consistency with Node.js and Chrome.
// So for denominator unit that does not have a perPattern, we will fall back to use its "per"
// compound pattern.
//
// For ja, if we format unit "celsius-by-celsius" nonsense, the fallback "per" pattern is
// "{0}毎{1}", and the celsius pattern itself is "摂氏 {0} 度". We sub the "{0}" in "per" compound
// pattern with the celsius pattern, and "{1}" with the celsius pattern with "{0}" removed. So we will
// end up having a weird "摂氏 {0} 度毎摂氏  度", which is what Node.js and Chrome gave us.
it('formats compound unit with fallback "per" compound pattern', () => {
  const options = {
    ...defaultOptions,
    style: 'unit',
    unit: 'celsius-per-celsius',
    unitDisplay: 'long',
  } as const;
  const data = require('../dist/locale-data/ja.json').data.ja;
  const pl = new Intl.PluralRules('ja');
  const n = {...baseNumberResult, formattedString: '42', roundedNumber: 42};
  expect(formatToParts(n, data, pl, options)).toEqual([
    {type: 'unit', value: '摂氏'},
    // Spacing around "{0}" are considered literal instead of unit...
    {type: 'literal', value: ' '},
    {type: 'integer', value: '42'},
    {type: 'literal', value: ' '},
    {type: 'unit', value: '度毎摂氏  度'},
  ]);
});

it('correctly formats NaN to parts', () => {
  const data = require('../dist/locale-data/en.json').data.en;
  const pl = new Intl.PluralRules('en');
  const n = {...baseNumberResult, formattedString: 'NaN', roundedNumber: NaN};
  expect(formatToParts(n, data, pl, defaultOptions)).toEqual([
    {type: 'nan', value: 'NaN'},
  ]);
});

it('correctly formats Infinity to parts', () => {
  const data = require('../dist/locale-data/en.json').data.en;
  const pl = new Intl.PluralRules('en');
  const n = {
    ...baseNumberResult,
    formattedString: '∞',
    roundedNumber: Infinity,
  };
  expect(formatToParts(n, data, pl, defaultOptions)).toEqual([
    {type: 'infinity', value: '∞'},
  ]);
});
