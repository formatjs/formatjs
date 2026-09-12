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
    pattern: '{month} {day}',
    pattern12: '{month} {day}',
    rangePatterns: {
      day: {
        day: 'numeric',
        month: 'short',
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
