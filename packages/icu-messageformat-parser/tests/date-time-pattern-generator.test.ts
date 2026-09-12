import {
  parse,
  isDateElement,
  isDateTimeSkeleton,
} from '#packages/icu-messageformat-parser/index.js'
import {getBestPattern} from '#packages/icu-messageformat-parser/date-time-pattern-generator.js'
import {describe, expect, it} from 'vitest'
describe('date-time-pattern-generator', () => {
  // Test most commong 2 patterns
  const testDatah12 = [
    {skeleton: '', expectedTimePattern: ''},

    // h12
    {skeleton: 'j', expectedTimePattern: 'ha'},
    {skeleton: 'jj', expectedTimePattern: 'hha'},
    {skeleton: 'jjj', expectedTimePattern: 'haaaa'},
    {skeleton: 'jjjj', expectedTimePattern: 'hhaaaa'},
    {skeleton: 'jjjjj', expectedTimePattern: 'haaaaa'},
    {skeleton: 'jjjjjj', expectedTimePattern: 'hhaaaaa'},
  ]
  const testDatah23 = [
    // h23
    {skeleton: 'j', expectedTimePattern: 'H'},
    {skeleton: 'jj', expectedTimePattern: 'HH'},
    {skeleton: 'jjj', expectedTimePattern: 'H'},
    {skeleton: 'jjjj', expectedTimePattern: 'HH'},
    {skeleton: 'jjjjj', expectedTimePattern: 'H'},
    {skeleton: 'jjjjjj', expectedTimePattern: 'HH'},
  ]
  describe('when locale has hourCycle', () => {
    it('returns desired time patterns', function () {
      let locale = new Intl.Locale('und', {hourCycle: 'h12'})
      testDatah12.forEach(data => {
        expect(getBestPattern(data.skeleton, locale)).toBe(
          data.expectedTimePattern
        )
      })

      locale = new Intl.Locale('und', {hourCycle: 'h23'})
      testDatah23.forEach(data => {
        expect(getBestPattern(data.skeleton, locale)).toBe(
          data.expectedTimePattern
        )
      })
    })
  })

  describe('when locale has no hourCycle', () => {
    it('returns desired time patterns', function () {
      let locale = new Intl.Locale('en-US')
      testDatah12.forEach(data => {
        expect(getBestPattern(data.skeleton, locale)).toBe(
          data.expectedTimePattern
        )
      })

      locale = new Intl.Locale('de-DE')
      testDatah23.forEach(data => {
        expect(getBestPattern(data.skeleton, locale)).toBe(
          data.expectedTimePattern
        )
      })
    })
  })
})

describe('locale hour cycle APIs', () => {
  it.each([
    ['fr-CA', 'h23', 'H'],
    ['zh-TW', 'h12', 'ha'],
  ])('uses getHourCycles for %s', (tag, cycle, pattern) => {
    const locale = new Intl.Locale(tag)
    Object.defineProperties(locale, {
      getHourCycles: {
        value() {
          expect(this).toBe(locale)
          return [cycle]
        },
      },
      hourCycles: {value: undefined},
    })
    expect(getBestPattern('j', locale)).toBe(pattern)
  })

  it.each([
    {modern: ['h23'], legacy: ['h12'], expected: 'H'},
    {modern: [], legacy: ['h12'], expected: 'ha'},
    {modern: undefined, legacy: ['h23'], expected: 'H'},
    {modern: undefined, legacy: undefined, expected: 'ha'},
  ])(
    'respects API precedence and fallback: %j',
    ({modern, legacy, expected}) => {
      const locale = new Intl.Locale('en-US')
      Object.defineProperties(locale, {
        getHourCycles: {value: modern === undefined ? undefined : () => modern},
        hourCycles: {value: legacy},
      })
      expect(getBestPattern('j', locale)).toBe(expected)
    }
  )

  it.each(['fr-CA-u-hc-h12', 'en-GB-u-hc-h12'])(
    'preserves explicit hour cycle for %s',
    tag => {
      const locale = new Intl.Locale(tag)
      Object.defineProperties(locale, {
        getHourCycles: {
          value() {
            throw new Error('Explicit hour cycle must win')
          },
        },
        hourCycles: {
          get() {
            throw new Error('Explicit hour cycle must win')
          },
        },
      })
      expect(getBestPattern('j', locale)).toBe('ha')
    }
  )
})

it.each(['fr-CA', 'zh-TW', 'en-GB', 'fr-CA-u-hc-h12', 'en-GB-u-hc-h12'])(
  'matches native date skeleton formatting for %s with the modern locale API',
  tag => {
    const locale = new Intl.Locale(tag)
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      timeZoneName: 'short',
      timeZone: 'UTC',
    }
    const native = new Intl.DateTimeFormat(tag, options)
    Object.defineProperties(locale, {
      getHourCycles: {value: () => [native.resolvedOptions().hourCycle]},
      hourCycles: {value: undefined},
    })
    const [element] = parse('{value, date, ::MMMdjz}', {locale})
    expect(isDateElement(element)).toBe(true)
    if (
      !isDateElement(element) ||
      !element.style ||
      !isDateTimeSkeleton(element.style)
    ) {
      throw new Error('Expected date skeleton')
    }
    const formatter = new Intl.DateTimeFormat(tag, {
      ...element.style.parsedOptions,
      timeZone: 'UTC',
    })
    const midnight = Date.UTC(2026, 0, 1)
    expect(formatter.format(midnight)).toBe(native.format(midnight))
  }
)

it.each([
  ['fr-CA', 'H'],
  ['zh-TW', 'ha'],
])('uses locale-specific CLDR fallback for %s', (tag, expected) => {
  const locale = new Intl.Locale(tag)
  Object.defineProperties(locale, {
    getHourCycles: {value: undefined},
    hourCycles: {value: undefined},
  })
  expect(getBestPattern('j', locale)).toBe(expected)
})
