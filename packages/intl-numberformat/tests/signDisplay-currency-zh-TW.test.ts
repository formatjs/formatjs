import '@formatjs/intl-pluralrules/polyfill-locales';
import {NumberFormat} from '../src';
NumberFormat.__addLocaleData(require('../dist/locale-data/zh.json'));
NumberFormat.__addLocaleData(require('../dist/locale-data/zh-Hant.json'));
NumberFormat.__addLocaleData(require('../dist/locale-data/zh-Hans.json'));

const tests = [
  [
    'auto',
    '(US$987.00)',
    '(US$0.00)',
    '(US$0.00)',
    'US$0.00',
    'US$0.00',
    'US$987.00',
  ],
  [
    'always',
    '(US$987.00)',
    '(US$0.00)',
    '(US$0.00)',
    '+US$0.00',
    '+US$0.00',
    '+US$987.00',
  ],
  [
    'never',
    'US$987.00',
    'US$0.00',
    'US$0.00',
    'US$0.00',
    'US$0.00',
    'US$987.00',
  ],
  [
    'exceptZero',
    '(US$987.00)',
    'US$0.00',
    'US$0.00',
    'US$0.00',
    'US$0.00',
    '+US$987.00',
  ],
] as const;

describe('signDisplay-currency-zh-TW', function () {
  for (const [
    signDisplay,
    negative,
    negativeNearZero,
    negativeZero,
    zero,
    positiveNearZero,
    positive,
  ] of tests) {
    const nf = new NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
      signDisplay,
    });
    describe(signDisplay, function () {
      it('negative', function () {
        expect(nf.format(-987)).toEqual(negative);
      });
      it('negativeNearZero', function () {
        expect(nf.format(-0.0001)).toEqual(negativeNearZero);
      });
      it('negativeZero', function () {
        expect(nf.format(-0)).toEqual(negativeZero);
      });
      it('zero', function () {
        expect(nf.format(0)).toEqual(zero);
      });
      it('positiveNearZero', function () {
        expect(nf.format(0.0001)).toEqual(positiveNearZero);
      });
      it('positive', function () {
        expect(nf.format(987)).toEqual(positive);
      });
    });
  }
});
