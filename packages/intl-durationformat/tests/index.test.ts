import {DurationFormat} from '#packages/intl-durationformat/core.js'
import {type DurationFormatOptions} from '#packages/intl-durationformat/index.js'
import {test, expect} from 'vitest'

test('Intl.DurationFormat resolvedOptions', function () {
  expect(new DurationFormat('en').resolvedOptions()).toEqual({
    days: 'short',
    daysDisplay: 'auto',
    fractionalDigits: undefined,
    hours: 'short',
    hoursDisplay: 'auto',
    locale: 'en',
    microseconds: 'short',
    microsecondsDisplay: 'auto',
    milliseconds: 'short',
    millisecondsDisplay: 'auto',
    minutes: 'short',
    minutesDisplay: 'auto',
    months: 'short',
    monthsDisplay: 'auto',
    nanoseconds: 'short',
    nanosecondsDisplay: 'auto',
    numberingSystem: 'latn',
    seconds: 'short',
    secondsDisplay: 'auto',
    style: 'short',
    weeks: 'short',
    weeksDisplay: 'auto',
    years: 'short',
    yearsDisplay: 'auto',
  })
})

test('Intl.DurationFormat format', function () {
  expect(new DurationFormat('en').format({years: 1})).toBe('1 yr')
  expect(new DurationFormat('en').format({years: 1, months: 2})).toBe(
    '1 yr, 2 mths'
  )
  expect(new DurationFormat('en').format({years: 1, months: 2, days: 3})).toBe(
    '1 yr, 2 mths, 3 days'
  )
  expect(
    new DurationFormat('en').format({years: 1, months: 2, days: 3, hours: 4})
  ).toBe('1 yr, 2 mths, 3 days, 4 hr')
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min')
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min, 6 sec')
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
      milliseconds: 7,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min, 6 sec, 7 ms')
})

test('Intl.DurationFormat format digital', function () {
  const customFormatterOptions: DurationFormatOptions = {style: 'digital'}

  expect(
    new DurationFormat('en', customFormatterOptions).format({years: 1})
  ).toBe('1 yr, 0:00:00')
  expect(
    new DurationFormat('en', customFormatterOptions).resolvedOptions()
      .milliseconds
  ).toBe('numeric')
  expect(
    new DurationFormat('en', customFormatterOptions).format({
      seconds: 1,
      milliseconds: 234,
    })
  ).toBe('0:00:01.234')
})

test('Intl.DurationFormat sub-second rollup is exact (#6462)', function () {
  // 1s + 473ms is exactly 1.473s. Float arithmetic — `1 + 473/1e3` —
  // lands on `1.4729999999999998650`, which `roundingMode: 'trunc'`
  // truncated to `1.472999999s` before the BigDecimal rewrite.
  expect(
    new DurationFormat('en', {
      milliseconds: 'numeric',
      style: 'narrow',
    }).format({milliseconds: 473, seconds: 1})
  ).toBe('1.473s')
  // Same kind of failure modes for milliseconds → microseconds and
  // microseconds → nanoseconds rollups.
  expect(
    new DurationFormat('en', {
      microseconds: 'numeric',
      style: 'narrow',
    }).format({milliseconds: 1, microseconds: 473})
  ).toBe('1.473ms')
  expect(
    new DurationFormat('en', {
      nanoseconds: 'numeric',
      style: 'narrow',
    }).format({microseconds: 1, nanoseconds: 473})
  ).toBe('1.473μs')
})

test('Intl.DurationFormat respects numberingSystem option (#6794)', function () {
  for (const locale of ['my-MM', 'bn-BD', 'ne-NP']) {
    const df = new DurationFormat(locale, {numberingSystem: 'latn'})
    expect(df.resolvedOptions().numberingSystem).toBe('latn')
    expect(
      df.formatToParts({years: 1}).find(part => part.type === 'integer')?.value
    ).toBe('1')
  }
  expect(
    new DurationFormat('my-MM', {
      hours: 'numeric',
      minutes: '2-digit',
      numberingSystem: 'latn',
      seconds: '2-digit',
      style: 'digital',
    }).format({
      hours: 1,
      minutes: 2,
      seconds: 3,
    })
  ).toBe('1:02:03')
})

test('Intl.DurationFormat hours with 2-digit', function () {
  expect(
    new DurationFormat('en', {
      hours: '2-digit',
      minutes: '2-digit',
      seconds: '2-digit',
    }).format({
      hours: 5,
      minutes: 30,
      seconds: 15,
    })
  ).toBe('05:30:15')
})

// TODO: even Node 18 doesn't have NFv3 yet
test.skip('Intl.DurationFormat format with NumberFormatV3', function () {
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
      milliseconds: 7,
      microseconds: 8,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min, 6 sec, 7 ms, 8 μs')
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
      milliseconds: 7,
      microseconds: 8,
      nanoseconds: 9,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min, 6 sec, 7 ms, 8 μs, 9 ns')
})

test('duration fields use Number coercion', () => {
  const formatter = new DurationFormat('en')
  expect(formatter.format({seconds: false} as any)).toBe(
    formatter.format({seconds: 0})
  )
  for (const seconds of [1n, Object(1n), {valueOf: () => 1n}]) {
    expect(() => formatter.format({seconds} as any)).toThrow(TypeError)
    expect(() => formatter.formatToParts({seconds} as any)).toThrow(TypeError)
  }
})

test('negotiates well-formed numbering systems and rejects malformed ones', () => {
  for (const numberingSystem of ['foobar', 'foo-bar', 'LATN']) {
    expect(
      new DurationFormat('en', {numberingSystem}).resolvedOptions()
        .numberingSystem
    ).toBe('latn')
  }
  for (const numberingSystem of ['', 'ab', 'abc_def', 'abcdefghi']) {
    expect(() => new DurationFormat('en', {numberingSystem})).toThrow(
      RangeError
    )
  }
})

test('reads duration fields once in specification order', () => {
  const reads: string[] = []
  const input = new Proxy(
    {seconds: 1},
    {
      get(target, key) {
        reads.push(String(key))
        return Reflect.get(target, key)
      },
    }
  )
  new DurationFormat('en').format(input)
  expect(reads).toEqual([
    'days',
    'hours',
    'microseconds',
    'milliseconds',
    'minutes',
    'months',
    'nanoseconds',
    'seconds',
    'weeks',
    'years',
  ])
})
test('accepts callable duration objects and rejects empty records', () => {
  const formatter = new DurationFormat('en')
  const input = Object.assign(() => {}, {seconds: 1})
  expect(formatter.format(input)).toBe(formatter.format({seconds: 1}))
  expect(() => formatter.format({})).toThrow(TypeError)
  expect(() => formatter.format(null as any)).toThrow(TypeError)
})
test('uses RangeError for nonintegral fields without repeated coercion', () => {
  const formatter = new DurationFormat('en')
  for (const seconds of [1.5, NaN, Infinity, -Infinity]) {
    expect(() => formatter.format({seconds})).toThrow(RangeError)
    expect(() => formatter.formatToParts({seconds})).toThrow(RangeError)
  }
  let calls = 0
  const seconds = {
    [Symbol.toPrimitive]() {
      calls++
      return 1.5
    },
  }
  expect(() => formatter.format({seconds} as any)).toThrow(RangeError)
  expect(calls).toBe(1)
})
test('enforces exact duration magnitude limits', () => {
  const formatter = new DurationFormat('en')
  for (const sign of [-1, 1]) {
    for (const unit of ['years', 'months', 'weeks'] as const) {
      expect(() => formatter.format({[unit]: sign * 2 ** 32})).toThrow(
        RangeError
      )
      expect(() =>
        formatter.format({[unit]: sign * (2 ** 32 - 1)})
      ).not.toThrow()
    }
    expect(() => formatter.format({seconds: sign * 2 ** 53})).toThrow(
      RangeError
    )
    const below = {
      seconds: sign * (2 ** 53 - 1),
      milliseconds: sign * 999,
      microseconds: sign * 999,
      nanoseconds: sign * 999,
    }
    expect(() => formatter.format(below)).not.toThrow()
    expect(() =>
      formatter.format({...below, nanoseconds: sign * 1000})
    ).toThrow(RangeError)
  }
})

test('DurationFormat built-in metadata', () => {
  expect(DurationFormat.length).toBe(0)
  expect(DurationFormat.supportedLocalesOf.length).toBe(1)
  expect(
    Object.getOwnPropertyDescriptor(
      DurationFormat.prototype,
      Symbol.toStringTag
    )
  ).toEqual({
    value: 'Intl.DurationFormat',
    writable: false,
    enumerable: false,
    configurable: true,
  })
  expect(Object.prototype.toString.call(new DurationFormat('en'))).toBe(
    '[object Intl.DurationFormat]'
  )
})

test('resolvedOptions preserves table order and omits undefined fractionalDigits', () => {
  const defaults = new DurationFormat('en').resolvedOptions()
  expect(Object.keys(defaults).slice(0, 3)).toEqual([
    'locale',
    'numberingSystem',
    'style',
  ])
  expect(Object.hasOwn(defaults, 'fractionalDigits')).toBe(false)
  const explicit = new DurationFormat('en', {
    fractionalDigits: 2,
  }).resolvedOptions()
  expect(explicit.fractionalDigits).toBe(2)
  expect(Object.keys(explicit).at(-1)).toBe('fractionalDigits')
})

test('negative duration has one sign across textual and digital units', () => {
  for (const style of ['long', 'short', 'narrow', 'digital'] as const) {
    const formatter = new DurationFormat('en', {style})
    const parts = formatter.formatToParts({
      days: -1,
      hours: -2,
      minutes: -3,
      seconds: -4,
    })
    expect(parts.filter(part => part.type === 'minusSign')).toHaveLength(1)
    expect(parts[0].type).toBe('minusSign')
    expect(parts.map(part => part.value).join('')).toBe(
      formatter.format({days: -1, hours: -2, minutes: -3, seconds: -4})
    )
  }
})

test('negative duration puts the sign on its first displayed zero', () => {
  expect(
    new DurationFormat('en', {style: 'digital'}).format({seconds: -1})
  ).toBe('-0:00:01')
  for (const style of ['long', 'short', 'narrow'] as const) {
    const formatter = new DurationFormat('en', {style, hoursDisplay: 'always'})
    const parts = formatter.formatToParts({seconds: -1})
    expect(parts[0]).toMatchObject({type: 'minusSign', unit: 'hour'})
    expect(parts.filter(part => part.type === 'minusSign')).toHaveLength(1)
  }
})

test('input negative zero does not create a negative duration sign', () => {
  const formatter = new DurationFormat('en', {style: 'digital'})
  expect(formatter.format({seconds: -0})).toBe(formatter.format({seconds: 0}))
  expect(
    formatter
      .formatToParts({seconds: -0})
      .some(part => part.type === 'minusSign')
  ).toBe(false)
})

test('digital duration omits grouping without losing fractional precision', () => {
  const formatter = new DurationFormat('en', {style: 'digital'})
  expect(
    formatter.format({hours: 1234, minutes: 1234567, seconds: 12345678})
  ).toBe('1234:1234567:12345678')
  const duration = {seconds: 10000000, nanoseconds: 1}
  expect(formatter.format(duration)).toBe('0:00:10000000.000000001')
  expect(
    formatter.formatToParts(duration).some(part => part.type === 'group')
  ).toBe(false)
  expect(new DurationFormat('en', {style: 'long'}).format({hours: 1234})).toBe(
    '1,234 hours'
  )
})

test('duration fractions use exact integer Number values beyond the safe range', () => {
  const formatter = new DurationFormat('en', {style: 'digital'})
  expect(
    formatter.format({
      milliseconds: Number(4503599627370497024n),
      microseconds: Number(4503599627370494951424n),
    })
  ).toBe('0:00:9007199254740991.975424')
})

test('numeric duration styles propagate through fractional units', () => {
  const formatter = new DurationFormat('en', {hours: 'numeric'})
  expect(formatter.resolvedOptions()).toMatchObject({
    minutes: '2-digit',
    minutesDisplay: 'always',
    seconds: '2-digit',
    secondsDisplay: 'always',
    milliseconds: 'numeric',
    microseconds: 'numeric',
    nanoseconds: 'numeric',
  })
  expect(formatter.format({hours: 1, nanoseconds: 1})).toBe('1:00:00.000000001')
  expect(
    () => new DurationFormat('en', {hours: 'numeric', microseconds: 'long'})
  ).toThrow(RangeError)
  expect(
    () =>
      new DurationFormat('en', {
        milliseconds: 'numeric',
        millisecondsDisplay: 'always',
      })
  ).toThrow(RangeError)
})
