import {DateTimeFormat} from '../src';
import * as en from '../dist/locale-data/en.json';
import allData from '../src/data';
// @ts-ignore
DateTimeFormat.__addLocaleData(en);
DateTimeFormat.__addTZData(allData);
describe('Intl.DateTimeFormat', function () {
  it('smoke test', function () {
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'America/New_York',
      }).format(new Date(0))
    ).toBe('');
  });
});
