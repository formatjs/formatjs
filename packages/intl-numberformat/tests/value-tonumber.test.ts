import '@formatjs/intl-pluralrules/polyfill-locales';
import {NumberFormat} from '../src';
import * as en from '../src/locale-data/en.json';
NumberFormat.__addLocaleData(en as any);
const toNumberResults = [
  [undefined, NaN],
  [null, +0],
  [true, 1],
  [false, +0],
  ['42', 42],
  ['foo', NaN],
];

describe('value-tonumber', function () {
  const nf = new NumberFormat();
  for (const [val1, val2] of toNumberResults) {
    it(`${val1} === ${val2}`, function () {
      expect(nf.formatToParts(val1 as number)).toEqual(
        nf.formatToParts(val2 as number)
      );
    });
  }
});
