import {
  parseDateTimeSkeleton,
  processDateTimePattern,
  splitRangePattern,
} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'
import {expect, test} from 'vitest'
test('splitRangePattern shares unique fields and the separator', () => {
  expect(splitRangePattern('{month} {day} - {day}')).toEqual([
    {pattern: '{month} ', source: 'shared'},
    {pattern: '{day}', source: 'startRange'},
    {pattern: ' - ', source: 'shared'},
    {pattern: '{day}', source: 'endRange'},
  ])
})

test('splitRangePattern preserves CJK literals outside endpoint fields', () => {
  expect(splitRangePattern('{month}月{day}日至{day}日')).toEqual([
    {pattern: '{month}月', source: 'shared'},
    {pattern: '{day}', source: 'startRange'},
    {pattern: '日至', source: 'shared'},
    {pattern: '{day}', source: 'endRange'},
    {pattern: '日', source: 'shared'},
  ])
})

test('splitRangePattern retains punctuation within repeated date spans', () => {
  expect(
    splitRangePattern('{month}/{day}/{year} through {month}/{day}/{year}')
  ).toEqual([
    {pattern: '{month}/{day}/{year}', source: 'startRange'},
    {pattern: ' through ', source: 'shared'},
    {pattern: '{month}/{day}/{year}', source: 'endRange'},
  ])
  expect(splitRangePattern('{month} {year}')).toEqual([
    {pattern: '{month} {year}', source: 'shared'},
  ])
})

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
    monthStandalone: false,
    pattern: '{month} {day}',
    pattern12: '{month} {day}',
    rangePatterns: {
      day: {
        day: 'numeric',
        month: 'short',
        monthStandalone: false,
        patternParts: [
          {pattern: '{month} ', source: 'shared'},
          {pattern: '{day}', source: 'startRange'},
          {pattern: ' – ', source: 'shared'},
          {
            pattern: '{day}',
            source: 'endRange',
          },
        ],
      },
      month: {
        day: 'numeric',
        month: 'short',
        monthStandalone: false,
        patternParts: [
          {pattern: '{month} {day}', source: 'startRange'},
          {pattern: ' – ', source: 'shared'},
          {
            pattern: '{month} {day}',
            source: 'endRange',
          },
        ],
      },
      default: {
        day: 'numeric',
        month: 'short',
        monthStandalone: false,
        patternParts: [
          {
            pattern: '{0}',
            source: 'startRange',
          },
          {
            pattern: ' - ',
            source: 'shared',
          },
          {
            pattern: '{1}',
            source: 'endRange',
          },
        ],
      },
    },
    rangePatterns12: {
      day: {
        day: 'numeric',
        month: 'short',
        monthStandalone: false,
        patternParts: [
          {pattern: '{month} ', source: 'shared'},
          {pattern: '{day}', source: 'startRange'},
          {pattern: ' – ', source: 'shared'},
          {
            pattern: '{day}',
            source: 'endRange',
          },
        ],
      },
      month: {
        day: 'numeric',
        month: 'short',
        monthStandalone: false,
        patternParts: [
          {pattern: '{month} {day}', source: 'startRange'},
          {pattern: ' – ', source: 'shared'},
          {
            pattern: '{month} {day}',
            source: 'endRange',
          },
        ],
      },
      default: {
        day: 'numeric',
        month: 'short',
        monthStandalone: false,
        patternParts: [
          {
            pattern: '{0}',
            source: 'startRange',
          },
          {
            pattern: ' - ',
            source: 'shared',
          },
          {
            pattern: '{1}',
            source: 'endRange',
          },
        ],
      },
    },
    rawPattern: 'MMM d',
    skeleton: 'MMMd',
  })
})

test('processDateTimePattern', function () {
  expect(processDateTimePattern('Bh:mm:ss')).toEqual([
    '{dayPeriod}{hour}:{minute}:{second}',
    '{dayPeriod}{hour}:{minute}:{second}',
  ])
  expect(processDateTimePattern('y年M月d日 Bh:mm:ss')).toEqual([
    '{year}年{month}月{day}日 {dayPeriod}{hour}:{minute}:{second}',
    '{year}年{month}月{day}日 {dayPeriod}{hour}:{minute}:{second}',
  ])
})

test('flexible day-period intervals retain their own field', () => {
  const format = parseDateTimeSkeleton('Bhm', 'h:mm B', {B: 'h:mm B – h:mm B'})
  expect(format.rangePatterns12.dayPeriod).toBeDefined()
  expect(format.rangePatterns12.ampm).toBeUndefined()
  expect(format.dayPeriod).toBe('short')
})

test('pattern parsing preserves quoted fields and doubled apostrophes', () => {
  expect(processDateTimePattern("h 'o''clock' a")).toEqual([
    "{hour} o'clock",
    "{hour} o'clock {ampm}",
  ])
  expect(processDateTimePattern("''yyyy 'year' MM")).toEqual([
    "'{year} year {month}",
    "'{year} year {month}",
  ])
})

test('expands compact fallback records while retaining explicit CLDR intervals', () => {
  const format = parseDateTimeSkeleton(
    'Hm',
    'HH:mm',
    {
      date: 'y-MM-dd HH:mm – y-MM-dd HH:mm',
      M: 'MMM d – MMM d',
      fallback: 'MMM d HH:mm – HH:mm',
    },
    '{0} - {1}'
  )
  expect(format.rangePatterns.year?.patternParts).toEqual([
    {pattern: '{year}-{month}-{day} {hour}:{minute}', source: 'startRange'},
    {pattern: ' – ', source: 'shared'},
    {pattern: '{year}-{month}-{day} {hour}:{minute}', source: 'endRange'},
  ])
  expect(format.rangePatterns.month?.month).toBe('short')
  expect(format.rangePatterns.default.patternParts[0]).toEqual({
    pattern: '{month} {day} ',
    source: 'shared',
  })
  expect(format.rangePatterns.default.hour).toBe('2-digit')
})

test('preserves fallback order and explicit interval order overrides', () => {
  const format = parseDateTimeSkeleton(
    'yMd',
    'y/M/d',
    {
      date: 'y/M/d – y/M/d',
      M: 'earliestFirst:MMM d – MMM d',
      d: 'latestFirst:MMM d – d, y',
      fallback: 'y/M/d – y/M/d',
    },
    '{1} – {0}'
  )
  expect(
    format.rangePatterns.year?.patternParts.find(
      part => part.source !== 'shared'
    )?.source
  ).toBe('endRange')
  expect(
    format.rangePatterns.month?.patternParts.find(
      part => part.source !== 'shared'
    )?.source
  ).toBe('startRange')
  expect(
    format.rangePatterns.day?.patternParts.find(
      part => part.source !== 'shared'
    )?.source
  ).toBe('endRange')
  expect(format.rangePatterns.default.patternParts[0].source).toBe('endRange')
})
