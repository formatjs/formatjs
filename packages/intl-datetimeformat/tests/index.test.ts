import '@formatjs/intl-getcanonicallocales/polyfill';
import {
  DateTimeFormat,
  basicFormatMatcherScore,
  bestFitFormatMatcherScore,
} from '../';
import * as en from './locale-data/en.json';
import * as enGB from './locale-data/en-GB.json';
import * as zhHans from './locale-data/zh-Hans.json';
import allData from '../src/data/all-tz';
import {parseDateTimeSkeleton} from '../src/skeleton';
// @ts-ignore
DateTimeFormat.__addLocaleData(en, enGB, zhHans);
DateTimeFormat.__addTZData(allData);
describe('Intl.DateTimeFormat', function () {
  it('smoke test EST', function () {
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
  it('en-GB default resolvedOptions, GH #1951', function () {
    expect(
      new DateTimeFormat('en-GB', {timeZone: 'UTC'}).resolvedOptions()
    ).toEqual({
      calendar: 'gregory',
      day: '2-digit',
      locale: 'en-GB',
      month: '2-digit',
      numberingSystem: 'latn',
      timeZone: 'UTC',
      year: 'numeric',
    });
  });
  it('en-GB default format, GH #1951', function () {
    expect(
      new DateTimeFormat('en-GB', {timeZone: 'UTC'}).format(new Date(0))
    ).toBe('01/01/1970');
  });
  it('smoke test CST', function () {
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('1/1/1970, 8:00:00 AM China Standard Time');
  });
  it('CST w/ undefined TZ', function () {
    const {TZ} = process.env;
    process.env.TZ = undefined;
    expect(
      new DateTimeFormat('en', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('1/1/1970, 8:00:00 AM China Standard Time');
    process.env.TZ = TZ;
  });
  it('smoke test for #1915', function () {
    const {TZ} = process.env;
    process.env.TZ = undefined;
    expect(
      new DateTimeFormat('zh-Hans', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date(0))
    ).toBe('1月1日星期四');
    process.env.TZ = TZ;
  });
  it('test for GH issue #1915', function () {
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(0))
    ).toBe('8:00 AM');
  });
  it('setDefaultTimeZone should work', function () {
    const defaultTimeZone = DateTimeFormat.getDefaultTimeZone();
    DateTimeFormat.__setDefaultTimeZone('Asia/Shanghai');
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(new Date(0))
    ).toBe('8:00 AM');
    DateTimeFormat.__setDefaultTimeZone(defaultTimeZone);
  });
  it('diff tz should yield different result', function () {
    const {TZ} = process.env;
    process.env.TZ = undefined;
    const now = new Date();
    expect(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Shanghai',
      }).format(now)
    ).not.toBe(
      new DateTimeFormat('en', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(now)
    );
    process.env.TZ = TZ;
  });
  it('month: long', function () {
    expect(
      new DateTimeFormat('en', {
        month: 'long',
      }).format(new Date(0))
    ).toBe('January');
  });
  it('negative ts', function () {
    expect(
      new DateTimeFormat('en', {weekday: 'short', timeZone: 'UTC'}).format(
        new Date(1899, 1, 1)
      )
    ).toBe('Wed');
  });
  it('basicFormatMatcherScore', function () {
    const opts = {
      weekday: 'short',
      era: 'short',
      year: '2-digit',
      month: 'narrow',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
      hour12: true,
    };
    expect(
      basicFormatMatcherScore(opts, parseDateTimeSkeleton('h:mm:ss a v'))
    ).toBe(-615);
    expect(
      basicFormatMatcherScore(opts, parseDateTimeSkeleton('HH:mm:ss v'))
    ).toBe(-612);
  });
  it('bestFitFormatMatcherScore', function () {
    const opts = {
      weekday: 'short',
      era: 'short',
      year: '2-digit',
      month: 'narrow',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
      hour12: true,
    };
    expect(
      bestFitFormatMatcherScore(opts, parseDateTimeSkeleton('h:mm:ss a v'))
    ).toBeGreaterThan(
      bestFitFormatMatcherScore(opts, parseDateTimeSkeleton('HH:mm:ss v'))
    );
  });
  it('bestFitFormatMatcherScore long weekday (ko)', function () {
    const opts = {
      weekday: 'long',
      era: 'short',
      year: '2-digit',
      month: 'narrow',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short',
      hour12: true,
    };
    expect(
      bestFitFormatMatcherScore(
        opts,
        parseDateTimeSkeleton('G y년 MMM d일 EEEE a h시 m분 s초 z')
      )
    ).toBeGreaterThan(
      bestFitFormatMatcherScore(
        opts,
        parseDateTimeSkeleton('G y년 MMM d일 (E) a h시 m분 s초 z')
      )
    );
  });
  it('bestFitFormatMatcherScore narrow weekday (ko)', function () {
    const opts = {
      weekday: 'short',
      era: 'short',
      year: '2-digit',
      month: 'narrow',
      day: '2-digit',
      hour: '2-digit',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short',
      hour12: true,
    };
    expect(
      bestFitFormatMatcherScore(
        opts,
        parseDateTimeSkeleton('G y년 MMM d일 (E) a h시 m분 s초 z')
      )
    ).toBeGreaterThan(
      bestFitFormatMatcherScore(
        opts,
        parseDateTimeSkeleton('G y년 MMM d일 EEEE a h시 m분 s초 z')
      )
    );
  });
});
