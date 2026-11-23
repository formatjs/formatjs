import {expect, it} from 'vitest'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import getInternalSlots from '#packages/intl-datetimeformat/get_internal_slots.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import {FormatDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {ToLocalTime} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'
import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import type {IntlDateTimeFormatPart} from '#packages/ecma402-abstract/types/date-time.js'

DateTimeFormat.__addLocaleData(en as any)

it.each([
  ['get', 'best fit'],
  ['get', 'lookup'],
  ['set', 'best fit'],
  ['set', 'lookup'],
] as const)(
  'formats through private cold/warm caches without WeakMap.prototype.%s (%s)',
  (method, localeMatcher) => {
    const create = () =>
      new DateTimeFormat('en', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
        localeMatcher,
      })
    const epoch = Date.UTC(2024, 0, 2)
    for (const warm of [false, true]) {
      const formatter = create()
      if (warm) formatter.formatToParts(epoch)
      const original = WeakMap.prototype[method]
      let actual: string[] | undefined, error: unknown
      try {
        WeakMap.prototype[method] = () => {
          throw new Error(`Mutable WeakMap.${method}`)
        }
        actual = [
          formatter.format(epoch),
          formatter
            .formatToParts(epoch)
            .map(part => part.value)
            .join(''),
          formatter.formatRange(epoch, epoch),
          formatter
            .formatRangeToParts(epoch, epoch)
            .map(part => part.value)
            .join(''),
          create().format(epoch),
        ]
      } catch (caught) {
        error = caught
      } finally {
        Object.defineProperty(WeakMap.prototype, method, {value: original})
      }
      expect(error, `warm=${warm}: ${(error as Error)?.stack}`).toBeUndefined()
      expect(actual).toEqual(Array(5).fill('01/02/2024'))
    }
  }
)

it('reloads locale patterns without public WeakMap cache methods', () => {
  const {get, set, delete: remove} = WeakMap.prototype
  let actual: string | undefined, error: unknown
  try {
    const poison = () => {
      throw new Error('Mutable WeakMap method')
    }
    WeakMap.prototype.get =
      WeakMap.prototype.set =
      WeakMap.prototype.delete =
        poison
    DateTimeFormat.__addLocaleData(en as any)
    actual = new DateTimeFormat('en', {
      year: 'numeric',
      timeZone: 'UTC',
    }).format(0)
  } catch (caught) {
    error = caught
  } finally {
    WeakMap.prototype.get = get
    WeakMap.prototype.set = set
    WeakMap.prototype.delete = remove
  }
  expect(error, (error as Error)?.stack).toBeUndefined()
  expect(actual).toBe('1970')
})

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
    nf: new Intl.NumberFormat('en', options).format,
    nf2: new Intl.NumberFormat('en', {...options, minimumIntegerDigits: 2})
      .format,
    nf3: new Intl.NumberFormat('en', {...options, minimumIntegerDigits: 2})
      .format,
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
