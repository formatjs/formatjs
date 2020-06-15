import {DateTimeFormat, basicFormatMatcherScore} from '../src';
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
    ).toBe('12/31/1969, 7:00:00 PM Eastern Standard Time');
  });
  it('basicFormatMatcher', function () {
    const opts = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'long',
      timeZone: 'America/New_York',
    };
    expect(
      basicFormatMatcherScore(opts, {
        pattern:
          '{month} {day}, {year} at {hour}:{minute}:{second}  {timeZoneName}',
        pattern12:
          '{month} {day}, {year} at {hour}:{minute}:{second} {ampm} {timeZoneName}',
        skeleton: "MMMM d, y 'at' h:mm:ss a zzzz",
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'long',
      })
    ).toBe(-18);
    expect(
      basicFormatMatcherScore(opts, {
        pattern:
          '{month}/{day}/{year}, {hour}:{minute}:{second}  {timeZoneName}',
        pattern12:
          '{month}/{day}/{year}, {hour}:{minute}:{second} {ampm} {timeZoneName}',
        skeleton: 'M/d/yy, h:mm:ss a zzzz',
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'long',
      })
    ).toBe(-18);
  });
});
