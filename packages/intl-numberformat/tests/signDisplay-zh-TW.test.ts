import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-pluralrules/polyfill-locales';
import {NumberFormat} from '../';
import * as zh from './locale-data/zh.json';
import * as zhHant from './locale-data/zh-Hant.json';
NumberFormat.__addLocaleData(zh as any, zhHant as any);

const tests = [
  ['auto', '-∞', '-987', '-0', '-0', '0', '0', '987', '∞', '非數值'],
  ['always', '-∞', '-987', '-0', '-0', '+0', '+0', '+987', '+∞', '+非數值'],
  ['never', '∞', '987', '0', '0', '0', '0', '987', '∞', '非數值'],
  ['exceptZero', '-∞', '-987', '0', '0', '0', '0', '+987', '+∞', '非數值'],
] as const;

describe('signDisplay-zh-TW', function () {
  for (const [
    signDisplay,
    negativeInfinity,
    negative,
    negativeNearZero,
    negativeZero,
    zero,
    positiveNearZero,
    positive,
  ] of tests) {
    const nf = new NumberFormat('zh-TW', {signDisplay});
    describe(signDisplay, function () {
      it('negativeInfinity', () => {
        expect(nf.format(-Infinity)).toEqual(negativeInfinity);
      });
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
