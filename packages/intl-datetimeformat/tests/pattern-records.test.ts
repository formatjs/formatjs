import {expect, it} from 'vitest'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import getInternalSlots from '#packages/intl-datetimeformat/get_internal_slots.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import {FormatDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {ToLocalTime} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'
import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import type {IntlDateTimeFormatPart} from '#packages/ecma402-abstract/types/date-time.js'

DateTimeFormat.__addLocaleData(en as any)

// Range rendering already supplies local time and native number formatters.
function renderer(pattern: string, numberingSystem = 'latn') {
  const epoch = BigInt('1704164645987000000') // 2024-01-02T03:04:05.987Z
  const formatter = new DateTimeFormat('en', {
    year: '2-digit',
    hour: 'numeric',
    fractionalSecondDigits: 2,
    numberingSystem,
    hourCycle: 'h23',
    timeZone: 'UTC',
  })
  const slots = getInternalSlots(formatter)
  const patternParts = PartitionPattern<IntlDateTimeFormatPart['type']>(pattern)
  const localTime = ToLocalTime(epoch, slots.calendar!, slots.timeZone, {
    tzData: DateTimeFormat.tzData,
  })
  const options = {numberingSystem, useGrouping: false}
  const numberFormatters = {
    nf: new Intl.NumberFormat('en', options),
    nf2: new Intl.NumberFormat('en', {...options, minimumIntegerDigits: 2}),
    nf3: new Intl.NumberFormat('en', {...options, minimumIntegerDigits: 2}),
  }
  return () =>
    FormatDateTimePattern(formatter, patternParts, epoch, false, {
      getInternalSlots,
      localeData: DateTimeFormat.localeData,
      getDefaultTimeZone: () => 'UTC',
      tzData: DateTimeFormat.tzData,
      rangeFormatOptions: {localTime, numberFormatters},
    })
}

it('retains unknown fields in pattern order with an ILND value', () => {
  const parts = renderer('A{customField}B{year}C{anotherField}')()
  expect(parts.map(part => part.type)).toEqual([
    'literal',
    'unknown',
    'literal',
    'year',
    'literal',
    'unknown',
  ])
  expect(parts[1].value).toBe('customField:1704164645987000000')
  expect(parts[5].value).toBe('anotherField:1704164645987000000')
})

it.each([
  ['latn', '24'],
  ['adlm', '\u{1E952}\u{1E954}'],
])(
  'keeps the final two %s code points for a two-digit year',
  (numberingSystem, value) => {
    expect(renderer('{year}', numberingSystem)()).toEqual([
      {type: 'year', value},
    ])
  }
)

it.each([
  'iterator',
  'push',
  'index setter',
  'Math.floor',
  'Array.from',
  'slice',
  'join',
  'string iterator',
])('renders private pattern records without observing %s', hook => {
  const render = renderer('A{year}B{fractionalSecondDigits}C', 'adlm')
  const expected = render()
  const define = Object.defineProperty
  const poison = () => {
    throw new Error(hook)
  }
  const owner =
    hook === 'Math.floor'
      ? Math
      : hook === 'Array.from'
        ? Array
        : hook === 'string iterator'
          ? String.prototype
          : Array.prototype
  const key =
    hook === 'iterator' || hook === 'string iterator'
      ? Symbol.iterator
      : hook === 'index setter'
        ? '0'
        : hook === 'Math.floor'
          ? 'floor'
          : hook === 'Array.from'
            ? 'from'
            : hook
  const descriptor = Object.getOwnPropertyDescriptor(owner, key)
  const replacement =
    hook === 'index setter'
      ? ({
          __proto__: null,
          configurable: true,
          set: poison,
        } as PropertyDescriptor)
      : ({
          __proto__: null,
          configurable: true,
          writable: true,
          value: poison,
        } as PropertyDescriptor)
  let actual: unknown, error: unknown
  try {
    define(owner, key, replacement)
    actual = render()
  } catch (caught) {
    error = caught
  } finally {
    if (descriptor) define(owner, key, descriptor)
    else Reflect.deleteProperty(owner, key)
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual(expected)
})
