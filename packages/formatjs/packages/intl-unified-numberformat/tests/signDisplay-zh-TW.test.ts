import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat} from '../src/core';
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/zh.json'));
UnifiedNumberFormat.__addLocaleData(
  require('../dist/locale-data/zh-Hant.json')
);
UnifiedNumberFormat.__addLocaleData(
  require('../dist/locale-data/zh-Hans.json')
);

function verifyFormatParts(actual: any[], expected: any[]) {
  expect(actual).toEqual(expected);
}

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
        verifyFormatParts(nf.formatToParts(-987), negative);
      });
      it('negativeNearZero', function() {
        verifyFormatParts(nf.formatToParts(-0.0001), negativeNearZero);
      });
      it('negativeZero', function() {
        verifyFormatParts(nf.formatToParts(-0), negativeZero);
      });
      it('zero', function() {
        verifyFormatParts(nf.formatToParts(0), zero);
      });
      it.only('positiveNearZero', function() {
        verifyFormatParts(nf.formatToParts(0.0001), positiveNearZero);
      });
      it('positive', function() {
        verifyFormatParts(nf.formatToParts(987), positive);
      });
    });
  }
});
