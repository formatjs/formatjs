import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat} from '../src/core';
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/en.json'));
const toNumberResults = [
  [undefined, NaN],
  [null, +0],
  [true, 1],
  [false, +0],
  ['42', 42],
  ['foo', NaN],
];

describe('value-tonumber', function() {
  const nf = new UnifiedNumberFormat();
  for (const [val1, val2] of toNumberResults) {
    it(`${val1} === ${val2}`, function() {
      expect(nf.formatToParts(val1 as number)).toEqual(
        nf.formatToParts(val2 as number)
      );
    });
  }
});
