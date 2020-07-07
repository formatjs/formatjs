import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-pluralrules/polyfill-locales';
import {NumberFormat} from '../';
import * as zh from '../tests-locale-data/zh.json';
import * as zhHant from '../tests-locale-data/zh-Hant.json';
NumberFormat.__addLocaleData(zh as any, zhHant as any);

const tests: any = [
  [
    -987,
    {
      short: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '987'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '987'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '987'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    -0.001,
    {
      short: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    -0,
    {
      short: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'minusSign', value: '-'},
        {type: 'integer', value: '0'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    0,
    {
      short: [
        {type: 'integer', value: '0'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'integer', value: '0'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'integer', value: '0'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    0.001,
    {
      short: [
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'integer', value: '0'},
        {type: 'decimal', value: '.'},
        {type: 'fraction', value: '001'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
  [
    987,
    {
      short: [
        {type: 'integer', value: '987'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
      narrow: [
        {type: 'integer', value: '987'},
        {type: 'unit', value: '公尺'},
      ],
      long: [
        {type: 'integer', value: '987'},
        {type: 'literal', value: ' '},
        {type: 'unit', value: '公尺'},
      ],
    },
  ],
];

describe('unit-zh-TW', function () {
  for (const [number, expectedData] of tests) {
    for (const unitDisplay in expectedData) {
      const expected = expectedData[unitDisplay];
      it(`${number} - ${unitDisplay}`, function () {
        const nf = new NumberFormat('zh-TW', {
          style: 'unit',
          unit: 'meter',
          unitDisplay: unitDisplay as 'narrow',
        });
        expect(nf.formatToParts(number)).toEqual(expected);
      });
    }
  }
});
