import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const Native = Intl.DateTimeFormat
const nativeParts = Native.prototype.formatToParts
const directory = runfiles.resolve(process.argv[2])
const {Temporal} = await import(pathToFileURL(join(directory, 'index.js')))
const rows = readFileSync(runfiles.resolve(process.argv[3]), 'utf8')
  .trim()
  .split('\n')
  .filter(line => {
    const row = line.split('\t')
    return (
      row[0] === 'F' &&
      ['chinese', 'dangi'].includes(row[1]) &&
      +row[3] >= 1900 &&
      +row[3] <= (row[1] === 'chinese' ? 2100 : 2050)
    )
  })
  .map(line => line.split('\t'))
assert.equal(rows.length, 8708, 'Complete authority-range field selection')
const numericOptions = {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
}
const originals = new Map(
  ['chinese', 'dangi'].map(calendar => [
    calendar,
    new Native('en-US-u-nu-latn', {calendar, ...numericOptions}),
  ])
)
const map = parts =>
  Object.fromEntries(parts.map(part => [part.type, part.value]))
const expected = row => ({
  relatedYear: row[3],
  month: String(+row[5].slice(1, 3)) + (row[5].endsWith('L') ? 'bis' : ''),
  day: row[6],
})
const differences = rows.filter(row => {
  const actual = map(
    nativeParts.call(originals.get(row[1]), +row[2] * 86400000)
  )
  return Object.entries(expected(row)).some(
    ([key, value]) => actual[key] !== value
  )
})
await import(pathToFileURL(join(directory, 'polyfill-force.js')))
{
  const hooks = [
    [Map.prototype, 'get'],
    [Map.prototype, 'set'],
    [Map.prototype, 'has'],
    [WeakMap.prototype, 'get'],
    [WeakMap.prototype, 'set'],
    [Array.prototype, 'find'],
    [Array.prototype, 'findIndex'],
    [Array.prototype, 'map'],
    [Array.prototype, 'join'],
    [Array.prototype, 'slice'],
  ].map(([target, key]) => [
    target,
    key,
    Object.getOwnPropertyDescriptor(target, key),
  ])
  for (const calendar of ['chinese', 'dangi']) {
    const row = differences.find(row => row[1] === calendar)
    assert(row, `${calendar} host calendar differs from the fixture`)
    const options = {...numericOptions, calendar, weekday: 'long'}
    const first = new Temporal.ZonedDateTime(
      BigInt(row[2]) * 86_400_000_000_000n,
      'UTC',
      calendar
    ).toPlainDate()
    const last = first.add({days: 1})
    const reference = new Intl.DateTimeFormat('en', options)
    for (const method of ['formatRange', 'formatRangeToParts']) {
      const expected = reference[method](first, last)
      const formatter = new Intl.DateTimeFormat('en', options)
      let actual
      try {
        for (const [target, key, descriptor] of hooks) {
          Object.defineProperty(target, key, {
            ...descriptor,
            value() {
              throw new Error(`Unexpected calendar range hook ${key}`)
            },
          })
        }
        actual = formatter[method](first, last)
      } finally {
        for (const [target, key, descriptor] of hooks)
          Object.defineProperty(target, key, descriptor)
      }
      assert.deepEqual(actual, expected, `${calendar} ${method}`)
    }
  }
}
const formatters = new Map(
  ['chinese', 'dangi'].map(calendar => [
    calendar,
    new Intl.DateTimeFormat('en-US-u-nu-latn', {calendar, ...numericOptions}),
  ])
)
// ECMA-402 §11.5.5 steps 1–4 and §11.5.11 steps 3–5.
// https://tc39.es/ecma402/#sec-partitiondatetimepattern
{
  const max = 8_640_000_000_000_000
  for (const [timeZone, firstISO, lastISO, hour] of [
    ['UTC', '-271821-04-20', '+275760-09-13', '00'],
    ['Etc/GMT+12', '-271821-04-19', '+275760-09-12', '12'],
    ['Etc/GMT-14', '-271821-04-20', '+275760-09-13', '14'],
  ]) {
    for (const calendar of ['chinese', 'dangi']) {
      const formatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
        ...numericOptions,
        calendar,
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hourCycle: 'h23',
      })
      const endpoints = new Map()
      for (const [milliseconds, iso] of [
        [-max, firstISO],
        [max, lastISO],
      ]) {
        const date = Temporal.PlainDate.from(iso).withCalendar(calendar)
        const parts = formatter.formatToParts(milliseconds)
        const actual = map(parts)
        const expected = {
          relatedYear: String(date.year),
          month:
            String(Number(date.monthCode.slice(1, 3))) +
            (date.monthCode.endsWith('L') ? 'bis' : ''),
          day: String(date.day),
          hour,
          minute: '00',
          second: '00',
          fractionalSecond: '000',
        }
        for (const [type, value] of Object.entries(expected))
          assert.equal(
            actual[type],
            value,
            `${calendar} ${timeZone} ${iso} ${type}`
          )
        assert.equal(
          formatter.format(milliseconds),
          parts.map(part => part.value).join('')
        )
        assert.throws(
          () => formatter.formatToParts(milliseconds + Math.sign(milliseconds)),
          RangeError
        )
        endpoints.set(milliseconds, actual)
      }
      for (const [start, end] of [
        [-max, max],
        [max, -max],
      ]) {
        const range = formatter.formatRangeToParts(start, end)
        for (const [source, milliseconds] of [
          ['startRange', start],
          ['endRange', end],
        ]) {
          const actual = map(range.filter(part => part.source === source))
          const expected = endpoints.get(milliseconds)
          for (const type of ['relatedYear', 'month', 'day'])
            assert.equal(actual[type], expected[type])
        }
        assert.equal(
          formatter.formatRange(start, end),
          range.map(part => part.value).join('')
        )
      }
      assert.throws(
        () => formatter.formatRangeToParts(max, max + 1),
        RangeError
      )
    }
  }
}
let checked = 0
for (const row of rows) {
  const milliseconds = +row[2] * 86400000
  const value = new Temporal.ZonedDateTime(
    BigInt(milliseconds) * 1000000n,
    'UTC',
    row[1]
  ).toPlainDate()
  const formatter = formatters.get(row[1])
  for (const input of [milliseconds, value]) {
    const parts = formatter.formatToParts(input),
      actual = map(parts)
    for (const [key, wanted] of Object.entries(expected(row)))
      assert.equal(actual[key], wanted, row.join('\t') + ' ' + key)
    assert.equal(
      formatter.format(input),
      parts.map(part => part.value).join('')
    )
    checked++
  }
}
for (const calendar of ['chinese', 'dangi']) {
  for (const locale of ['en-US', 'ar-EG', 'ja', 'bn', 'zh-Hans-u-nu-hanidec']) {
    for (const month of ['numeric', '2-digit', 'long', 'narrow']) {
      const options = {
        calendar,
        timeZone: 'UTC',
        year: 'numeric',
        month,
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }
      const formatter = new Intl.DateTimeFormat(locale, options)
      const native = new Native(locale, options)
      const candidates = differences
        .filter(row => row[1] === calendar)
        .slice(0, 16)
      for (const row of candidates) {
        const milliseconds = +row[2] * 86400000 + 12 * 3600000
        const value = new Temporal.ZonedDateTime(
          BigInt(milliseconds) * 1000000n,
          'UTC',
          calendar
        ).toPlainDateTime()
        const parts = formatter.formatToParts(value),
          actual = map(parts)
        const control = rows.find(
          candidate =>
            candidate[1] === calendar &&
            candidate[5] === row[5] &&
            candidate[6] === row[6] &&
            !differences.includes(candidate)
        )
        assert(control, 'Independent matching label control')
        const labels = map(
          nativeParts.call(native, +control[2] * 86400000 + 12 * 3600000)
        )
        assert.equal(actual.day, labels.day)
        assert.equal(actual.month, labels.month)
        const original = map(nativeParts.call(native, milliseconds))
        for (const key of ['weekday', 'hour', 'minute', 'dayPeriod'])
          assert.equal(actual[key], original[key])
        assert.equal(
          formatter.format(value),
          parts.map(part => part.value).join('')
        )
        const number = formatter.formatToParts(milliseconds)
        assert.deepEqual(number, parts)
        assert.equal(
          value.toLocaleString(locale, options),
          formatter.format(value)
        )
        const last = milliseconds + 86400000
        const range = formatter.formatRangeToParts(milliseconds, last)
        assert(range.some(part => part.source === 'startRange'))
        assert(range.some(part => part.source === 'endRange'))
        assert.equal(
          formatter.formatRange(milliseconds, last),
          range.map(part => part.value).join('')
        )
        for (const [source, instant] of [
          ['startRange', milliseconds],
          ['endRange', last],
        ]) {
          const expectedParts = map(formatter.formatToParts(instant))
          for (const part of range.filter(
            part => part.source === source && part.type !== 'literal'
          ))
            assert.equal(
              part.value,
              expectedParts[part.type],
              source + ' ' + part.type
            )
        }
        checked++
      }
    }
  }
}
for (const row of differences) {
  const milliseconds = +row[2] * 86400000 + 12 * 3600000
  for (const timeZone of [
    'America/New_York',
    'Asia/Shanghai',
    'Pacific/Honolulu',
  ]) {
    const formatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
      ...numericOptions,
      calendar: row[1],
      timeZone,
      weekday: 'long',
      hour: 'numeric',
    })
    const native = new Native('en-US-u-nu-latn', {
      ...numericOptions,
      calendar: row[1],
      timeZone,
      weekday: 'long',
      hour: 'numeric',
    })
    const actual = map(formatter.formatToParts(milliseconds))
    for (const [key, wanted] of Object.entries(expected(row)))
      assert.equal(actual[key], wanted, timeZone + ' ' + row.join('\t'))
    const original = map(nativeParts.call(native, milliseconds))
    assert.equal(actual.weekday, original.weekday)
    assert.equal(actual.hour, original.hour)
    checked++
  }
}
for (const calendar of ['chinese', 'dangi']) {
  const formatter = formatters.get(calendar)
  const before = Temporal.Now.plainDateISO('UTC').withCalendar(calendar)
  const current = formatter.format()
  const after = Temporal.Now.plainDateISO('UTC').withCalendar(calendar)
  assert([formatter.format(before), formatter.format(after)].includes(current))
}
for (const [calendar, dates, month, monthCodes, days] of [
  ['chinese', ['1954-02-04', '1954-02-05'], 'long', ['M01', 'M01'], [2, 3]],
  ['chinese', ['1954-02-04', '1954-03-06'], undefined, ['M01', 'M02'], [2, 2]],
  ['dangi', ['2017-02-27', '2017-02-28'], 'long', ['M02', 'M02'], [2, 3]],
  ['dangi', ['2017-02-27', '2017-03-29'], undefined, ['M02', 'M03'], [2, 2]],
]) {
  const options = {calendar, timeZone: 'UTC', month, day: 'numeric'}
  const numbers = dates.map(date => Date.parse(`${date}T00:00Z`))
  const plain = dates.map(date =>
    Temporal.PlainDate.from(date).withCalendar(calendar)
  )
  assert.deepEqual(
    plain.map(date => date.monthCode),
    monthCodes
  )
  assert.deepEqual(
    plain.map(date => date.day),
    days
  )
  const raw = new Native('en', options).formatRangeToParts(...numbers)
  assert.deepEqual(
    raw.filter(part => part.type === 'month').map(part => part.source),
    month ? ['shared'] : ['startRange', 'endRange']
  )
  const expected = raw.map(part => {
    if (part.type !== 'day') return part
    const end = part.source === 'endRange'
    assert.equal(part.value, end ? '2' : '1')
    return {...part, value: String(days[end ? 1 : 0])}
  })
  const formatter = new Intl.DateTimeFormat('en', options)
  for (const input of [numbers, plain]) {
    assert.deepEqual(formatter.formatRangeToParts(...input), expected)
    assert.equal(
      formatter.formatRange(...input),
      expected.map(part => part.value).join('')
    )
    checked++
  }
}
for (const [calendar, dates, years, monthCodes, oldDays, days] of [
  [
    'chinese',
    ['1954-02-02', '1954-02-04'],
    [1953, 1954],
    ['M12', 'M01'],
    [29, 1],
    [29, 2],
  ],
  [
    'dangi',
    ['2017-01-27', '2017-02-27'],
    [2016, 2017],
    ['M12', 'M02'],
    [30, 1],
    [30, 2],
  ],
]) {
  const options = {
    calendar,
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  const milliseconds = dates.map(date => Date.parse(`${date}T00:00Z`))
  const plain = dates.map(date =>
    Temporal.PlainDate.from(date).withCalendar(calendar)
  )
  assert.deepEqual(
    plain.map(date => date.year),
    years
  )
  assert.deepEqual(
    plain.map(date => date.monthCode),
    monthCodes
  )
  assert.deepEqual(
    plain.map(date => date.day),
    days
  )
  const raw = new Native('en', options).formatRangeToParts(...milliseconds)
  for (const type of ['relatedYear', 'yearName']) {
    assert.deepEqual(
      raw.filter(part => part.type === type).map(part => part.source),
      ['startRange', 'endRange']
    )
  }
  const expected = raw.map(part => {
    if (part.type !== 'day') return part
    const index = part.source === 'endRange' ? 1 : 0
    assert.equal(part.value, String(oldDays[index]))
    return {...part, value: String(days[index])}
  })
  const formatter = new Intl.DateTimeFormat('en', options)
  for (const inputs of [milliseconds, plain]) {
    assert.deepEqual(formatter.formatRangeToParts(...inputs), expected)
    assert.equal(
      formatter.formatRange(...inputs),
      expected.map(part => part.value).join('')
    )
    checked++
  }
}

function leapRangeParts(
  native,
  [startControl, start, end, endControl],
  monthSources = ['startRange', 'endRange']
) {
  const startParts = native.formatRangeToParts(start, endControl)
  const endParts = native.formatRangeToParts(startControl, end)
  assert.equal(startParts.length, endParts.length)
  const expected = startParts.map((part, index) => {
    const other = endParts[index]
    assert.equal(part.type, other.type)
    assert.equal(part.source, other.source)
    if (part.type === 'literal' || part.source === 'shared')
      assert.equal(part.value, other.value)
    return part.source === 'endRange' ? other : part
  })
  assert.deepEqual(
    expected.filter(part => part.type === 'month').map(part => part.source),
    monthSources
  )
  return expected
}

for (const calendar of ['chinese', 'dangi']) {
  for (const dates of [
    ['2020-03-24', '2020-04-23', '2020-05-23', '2020-06-21'],
    ['2020-03-24', '2020-04-23', '2020-05-24', '2020-06-22'],
    ['1933-04-24', '1933-06-22', '1933-07-22', '1933-09-19'],
    ['1909-06-17', '1909-03-21', '1909-03-22', '1909-04-20'],
  ]) {
    const numbers = dates.map(date => Date.parse(`${date}T00:00Z`))
    const plain = dates
      .slice(1, 3)
      .map(date => Temporal.PlainDate.from(date).withCalendar(calendar))
    for (const [locale, fields] of [
      ['en', {day: 'numeric'}],
      ['de', {day: 'numeric'}],
      ['zh-CN', {day: 'numeric'}],
      ['en-u-nu-mathsans', {day: 'numeric'}],
      ['en', {year: 'numeric', month: 'long', day: 'numeric'}],
      ['en', {dateStyle: 'full'}],
    ]) {
      const options = {calendar, timeZone: 'UTC', ...fields}
      const native = new Native(locale, options)
      const formatter = new Intl.DateTimeFormat(locale, options)
      const expected = leapRangeParts(native, numbers)
      for (const inputs of [numbers.slice(1, 3), plain]) {
        assert.deepEqual(formatter.formatRangeToParts(...inputs), expected)
        assert.equal(
          formatter.formatRange(...inputs),
          expected.map(part => part.value).join('')
        )
        checked++
      }
    }
  }
  for (const dates of [
    ['2020-03-24', '2020-04-23', '2020-05-23', '2020-06-21'],
    ['1933-04-24', '1933-06-22', '1933-07-22', '1933-09-19'],
  ]) {
    const times = dates.map(
      (date, index) => `${date}T${index < 2 ? '09:15:03.123' : '16:45:10.456'}`
    )
    const numbers = times.map(time => Date.parse(`${time}Z`))
    const fractional = numbers
      .slice(1, 3)
      .map(time => time + Math.sign(time) * 0.75)
    const plain = times
      .slice(1, 3)
      .map(time => Temporal.PlainDateTime.from(time).withCalendar(calendar))
    for (const [locale, fields, monthSources] of [
      ['en', {day: 'numeric', hour: 'numeric', minute: '2-digit'}],
      ['zh', {dateStyle: 'full', timeStyle: 'short'}],
      [
        'fr',
        {
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        },
        [],
      ],
      [
        'fr',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        },
      ],
    ]) {
      const options = {calendar, timeZone: 'UTC', ...fields}
      const formatter = new Intl.DateTimeFormat(locale, options)
      const expected = leapRangeParts(
        new Native(locale, options),
        numbers,
        monthSources
      )
      for (const inputs of [fractional, plain]) {
        assert.deepEqual(formatter.formatRangeToParts(...inputs), expected)
        assert.equal(
          formatter.formatRange(...inputs),
          expected.map(part => part.value).join('')
        )
        checked++
      }
    }
  }
  const yearOptions = {calendar, timeZone: 'UTC', year: 'numeric'}
  const nativeYear = new Native('en', yearOptions)
  const yearOnly = new Intl.DateTimeFormat('en', yearOptions)
  for (const [last, reference, month, labels] of [
    ['2020-05-23', '2020-06-21', 'numeric', ['4', '5', '4bis']],
    [
      '2020-05-24',
      '2020-06-22',
      'long',
      ['Fourth Month', 'Fifth Month', 'Fourth Monthbis'],
    ],
  ]) {
    const options = {calendar, timeZone: 'UTC', month, day: 'numeric'}
    const native = new Native('en', options)
    const formatter = new Intl.DateTimeFormat('en', options)
    const dates = ['2020-04-23', last]
    const milliseconds = dates.map(date => Date.parse(`${date}T00:00Z`))
    const plain = dates.map(date =>
      Temporal.PlainDate.from(date).withCalendar(calendar)
    )
    assert.deepEqual(
      plain.map(date => date.monthCode),
      ['M04', 'M04L']
    )
    const raw = native.formatRangeToParts(...milliseconds)
    assert.deepEqual(
      raw.filter(part => part.type === 'month'),
      [{type: 'month', value: labels[0], source: 'shared'}]
    )
    const expected = native
      .formatRangeToParts(milliseconds[0], Date.parse(`${reference}T00:00Z`))
      .map(part => {
        if (part.type !== 'month' || part.source !== 'endRange') return part
        assert.equal(part.value, labels[1])
        return {...part, value: labels[2]}
      })
    const expectedYear = nativeYear.formatRangeToParts(...milliseconds)
    assert.ok(expectedYear.every(part => part.source === 'shared'))
    for (const inputs of [milliseconds, plain]) {
      assert.deepEqual(formatter.formatRangeToParts(...inputs), expected)
      assert.equal(
        formatter.formatRange(...inputs),
        expected.map(part => part.value).join('')
      )
      assert.deepEqual(yearOnly.formatRangeToParts(...inputs), expectedYear)
      checked++
    }
  }
  const twoDigit = {calendar, timeZone: 'UTC', month: '2-digit', day: 'numeric'}
  const milliseconds = ['2020-04-23', '2020-05-24'].map(date =>
    Date.parse(`${date}T00:00Z`)
  )
  const raw = new Native('en', twoDigit).formatRangeToParts(...milliseconds)
  assert.deepEqual(
    raw.filter(part => part.type === 'month').map(part => part.source),
    ['startRange', 'endRange']
  )
  assert.deepEqual(
    new Intl.DateTimeFormat('en', twoDigit).formatRangeToParts(...milliseconds),
    raw
  )
  checked++
}
console.log(
  `${rows.length} independent lunar field rows; ${differences.length} native data differences; ${checked} formatting checks`
)
