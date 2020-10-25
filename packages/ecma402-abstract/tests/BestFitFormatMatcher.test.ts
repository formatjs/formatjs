import {
  bestFitFormatMatcherScore,
  BestFitFormatMatcher,
} from '../src/DateTimeFormat/BestFitFormatMatcher';
import {parseDateTimeSkeleton} from '../src/DateTimeFormat/skeleton';

test('bestFitFormatMatcherScore', function () {
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
test('BestFitFormatMatcher second tz', function () {
  const availableFormats = {
    'h:mm:ss a zzzz': 'h:mm:ss a zzzz',
    'h:mm:ss a z': 'h:mm:ss a z',
    h: 'h a',
    H: 'HH',
    hm: 'h:mm a',
    Hm: 'HH:mm',
    hms: 'h:mm:ss a',
    Hms: 'HH:mm:ss',
    hmsv: 'h:mm:ss a v',
    Hmsv: 'HH:mm:ss v',
    hmv: 'h:mm a v',
    Hmv: 'HH:mm v',
  };
  expect(
    BestFitFormatMatcher(
      {
        year: undefined,
        month: undefined,
        day: undefined,
        hour: '2-digit',
        minute: '2-digit',
        second: undefined,
        timeZoneName: 'short',
        hour12: true,
      },
      Object.keys(availableFormats).map(k =>
        parseDateTimeSkeleton(k, availableFormats[k as 'h'])
      )
    )
  ).toEqual({
    hour: '2-digit',
    hour12: true,
    minute: '2-digit',
    pattern: '{hour}:{minute} {timeZoneName}',
    pattern12: '{hour}:{minute} {ampm} {timeZoneName}',
    rawPattern: 'h:mm a v',
    skeleton: 'h:mm a v',
    timeZoneName: 'short',
  });
});
test('bestFitFormatMatcherScore second tz', function () {
  const opts = {
    year: undefined,
    month: undefined,
    day: undefined,
    hour: '2-digit',
    minute: '2-digit',
    second: undefined,
    timeZoneName: 'short',
    hour12: true,
  };
  expect(
    bestFitFormatMatcherScore(opts, parseDateTimeSkeleton('hmv', 'h:mm a v'))
  ).toBeGreaterThan(
    bestFitFormatMatcherScore(
      opts,
      parseDateTimeSkeleton('h:mm:ss a z', 'h:mm:ss a z')
    )
  );
});
test('bestFitFormatMatcherScore long weekday (ko)', function () {
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
test('bestFitFormatMatcherScore narrow weekday (ko)', function () {
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
