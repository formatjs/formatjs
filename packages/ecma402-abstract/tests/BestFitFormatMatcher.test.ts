import {bestFitFormatMatcherScore} from '../src/DateTimeFormat/BestFitFormatMatcher';
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
