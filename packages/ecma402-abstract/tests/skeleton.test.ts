import {
  parseDateTimeSkeleton,
  splitRangePattern,
} from '../src/DateTimeFormat/skeleton';

test('splitRangePattern basic case', function () {
  expect(splitRangePattern('{month} {day} - {day}')).toEqual([
    {
      pattern: '{month} {day} - ',
      source: 'startRange',
    },
    {
      pattern: '{day}',
      source: 'endRange',
    },
  ]);
});

test('splitRangePattern zh', function () {
  expect(splitRangePattern('{month}月{day}日至{day}日')).toEqual([
    {
      pattern: '{month}月{day}日至',
      source: 'startRange',
    },
    {
      pattern: '{day}日',
      source: 'endRange',
    },
  ]);
});

test('parseDateTimeSkeleton', function () {
  expect(
    parseDateTimeSkeleton(
      'MMMd',
      'MMM d',
      {
        d: 'MMM d – d',
        M: 'MMM d – MMM d',
      },
      '{0} - {1}'
    )
  ).toEqual({
    day: 'numeric',
    month: 'short',
    pattern: '{month} {day}',
    pattern12: '{month} {day}',
    rangePatterns: {
      day: {
        day: 'numeric',
        month: 'short',
        patternParts: [
          {
            pattern: '{month} {day} – ',
            source: 'startRange',
          },
          {
            pattern: '{day}',
            source: 'endRange',
          },
        ],
      },
      month: {
        day: 'numeric',
        month: 'short',
        patternParts: [
          {
            pattern: '{month} {day} – ',
            source: 'startRange',
          },
          {
            pattern: '{month} {day}',
            source: 'endRange',
          },
        ],
      },
    },
    rangePatterns12: {
      day: {
        day: 'numeric',
        month: 'short',
        patternParts: [
          {
            pattern: '{month} {day} – ',
            source: 'startRange',
          },
          {
            pattern: '{day}',
            source: 'endRange',
          },
        ],
      },
      month: {
        day: 'numeric',
        month: 'short',
        patternParts: [
          {
            pattern: '{month} {day} – ',
            source: 'startRange',
          },
          {
            pattern: '{month} {day}',
            source: 'endRange',
          },
        ],
      },
    },
    rawPattern: 'MMM d',
    skeleton: 'MMMd',
  });
});
