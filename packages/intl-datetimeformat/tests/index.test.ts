import {
  DateTimeFormat,
  basicFormatMatcherScore,
  bestFitFormatMatcherScore,
} from '../src';
import * as en from '../dist/locale-data/en.json';
import allData from '../src/data';
import {parseDateTimeSkeleton} from '../src/skeleton';
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
  it('negative ts', function () {
    // TODO: Fix the pattern matching here
    expect(
      new DateTimeFormat('en', {weekday: 'short'}).format(new Date(1899, 1, 1))
    ).toBe('Wed, 5 AM');
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
