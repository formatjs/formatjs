import '@formatjs/intl-pluralrules/polyfill-locales';
import {UnifiedNumberFormat} from '../src/core';
UnifiedNumberFormat.__addLocaleData(require('../dist/locale-data/ko.json'));

const tests: any[] = [
  [
    987654321,
    [
      {type: 'integer', value: '9'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '9'},
      {type: 'compact', value: '억'},
    ],
  ],
  [
    98765432,
    [
      {type: 'integer', value: '9877'},
      {type: 'compact', value: '만'},
    ],
  ],
  [
    98765,
    [
      {type: 'integer', value: '9'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '9'},
      {type: 'compact', value: '만'},
    ],
  ],
  [
    9876,
    [
      {type: 'integer', value: '9'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '9'},
      {type: 'compact', value: '천'},
    ],
  ],
  [159, [{type: 'integer', value: '159'}]],
  [15.9, [{type: 'integer', value: '16'}]],
  [
    1.59,
    [
      {type: 'integer', value: '1'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '6'},
    ],
  ],
  [
    0.159,
    [
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '16'},
    ],
  ],
  [
    0.0159,
    [
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '016'},
    ],
  ],
  [
    0.00159,
    [
      {type: 'integer', value: '0'},
      {type: 'decimal', value: '.'},
      {type: 'fraction', value: '0016'},
    ],
  ],
];

describe('notation-compact-ko-KR', function() {
  for (const [number, short, long = short] of tests) {
    it(`${number} short`, function() {
      const nfShort = new UnifiedNumberFormat('ko-KR', {
        notation: 'compact',
        compactDisplay: 'short',
      });
      expect(nfShort.formatToParts(number)).toEqual(short);
    });

    it(`${number} long`, function() {
      const nfLong = new UnifiedNumberFormat('ko-KR', {
        notation: 'compact',
        compactDisplay: 'long',
      });
      expect(nfLong.formatToParts(number)).toEqual(long);
    });
  }
});
