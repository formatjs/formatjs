import '@formatjs/intl-getcanonicallocales/polyfill';
import {DateTimeFormat} from '../src/core';
import * as en from './locale-data/en.json';
import * as enGB from './locale-data/en-GB.json';
import * as zhHans from './locale-data/zh-Hans.json';
import * as fa from './locale-data/fa.json';
import allData from '../src/data/all-tz';

// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB, zhHans, fa);
DateTimeFormat.__addTZData(allData);
describe('Intl.DateTimeFormat range format', function () {
  it('basic', function () {
    const d1 = new Date(2020, 1, 1);
    const d2 = new Date(2020, 1, 15);
    const dtf = new DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    });
    expect(dtf.formatRange(d1, d2)).toBe('Feb 1 – 15');
  });
  it('basic parts', function () {
    const d1 = new Date(2020, 1, 1);
    const d2 = new Date(2020, 1, 15);

    expect(
      new DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
      }).formatRangeToParts(d1, d2)
    ).toEqual([
      {
        source: 'startRange',
        type: 'month',
        value: 'Feb',
      },
      {
        source: 'startRange',
        type: 'literal',
        value: ' ',
      },
      {
        source: 'startRange',
        type: 'day',
        value: '1',
      },
      {
        source: 'startRange',
        type: 'literal',
        value: ' – ',
      },
      {
        source: 'endRange',
        type: 'day',
        value: '15',
      },
    ]);
  });
});
