import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat} from '../src/core';
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/zh.json'));
UnifiedNumberFormat.__addLocaleData(
  require('../dist/locale-data/zh-Hant.json')
);
UnifiedNumberFormat.__addLocaleData(
  require('../dist/locale-data/zh-Hans.json')
);
const tests: any[] = [
  [
    'auto',
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '987'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '987'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
  ],
  [
    'always',
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '987'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '987'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
  ],
  [
    'never',
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '987'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '987'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
  ],
  [
    'exceptZero',
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '987'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'literal', value: '('},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
      {type: 'literal', value: ')'},
    ],
    [
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'currency', value: 'US$'},
      {type: 'integer', value: '987'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '00'},
    ],
  ],
];
describe('signDisplay-currency-zh-TW', function() {
  for (const [
    signDisplay,
    negative,
    negativeNearZero,
    negativeZero,
    zero,
    positiveNearZero,
    positive,
  ] of tests) {
    const nf = new UnifiedNumberFormat('zh-TW', {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
      signDisplay,
    });
    describe(signDisplay, function() {
      it('negative', function() {
        expect(nf.formatToParts(-987)).toEqual(negative);
      });
      it('negativeNearZero', function() {
        expect(nf.formatToParts(-0.0001)).toEqual(negativeNearZero);
      });
      it('negativeZero', function() {
        expect(nf.formatToParts(-0)).toEqual(negativeZero);
      });
      it('zero', function() {
        expect(nf.formatToParts(0)).toEqual(zero);
      });
      it('positiveNearZero', function() {
        expect(nf.formatToParts(0.0001)).toEqual(positiveNearZero);
      });
      it('positive', function() {
        expect(nf.formatToParts(987)).toEqual(positive);
      });
    });
  }
});
