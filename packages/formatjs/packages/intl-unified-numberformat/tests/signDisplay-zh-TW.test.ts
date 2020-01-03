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
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '987'},
    ],
    [
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '0'},
    ],
    [
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '0'},
    ],
    [{type: 'integer', value: '0'}],
    [{type: 'integer', value: '0'}],
    [{type: 'integer', value: '987'}],
  ],
  [
    'always',
    [
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '987'},
    ],
    [
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '0'},
    ],
    [
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '0'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'integer', value: '0'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'integer', value: '0'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'integer', value: '987'},
    ],
  ],
  [
    'never',
    [{type: 'integer', value: '987'}],
    [{type: 'integer', value: '0'}],
    [{type: 'integer', value: '0'}],
    [{type: 'integer', value: '0'}],
    [{type: 'integer', value: '0'}],
    [{type: 'integer', value: '987'}],
  ],
  [
    'exceptZero',
    [
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '987'},
    ],
    [
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '0'},
    ],
    [
      {type: 'minusSign', value: '-'},
      {type: 'integer', value: '0'},
    ],
    [{type: 'integer', value: '0'}],
    [
      {type: 'plusSign', value: '+'},
      {type: 'integer', value: '0'},
    ],
    [
      {type: 'plusSign', value: '+'},
      {type: 'integer', value: '987'},
    ],
  ],
];

describe('signDisplay-zh-TW', function() {
  for (const [
    signDisplay,
    negative,
    negativeNearZero,
    negativeZero,
    zero,
    positiveNearZero,
    positive,
  ] of tests) {
    const nf = new UnifiedNumberFormat('zh-TW', {signDisplay});
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
