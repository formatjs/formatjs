;(function () {
  'use strict'
  function check(value) {
    if (!value) throw new Error('DurationFormat default-runtime assertion')
  }
  var Constructor = Intl.DurationFormat
  var fixtures = globalThis.__DURATION_FIXTURES
  for (var index = 0; index < fixtures.locales.length; index++) {
    Constructor.__addNumberFormatData(fixtures.numbers[index])
    Constructor.__addListFormatData(fixtures.lists[index])
  }
  var seen = []
  var options = new Proxy(
    {style: 'digital'},
    {
      get: function (target, key) {
        seen.push(key)
        return target[key]
      },
    }
  )
  var model = new Constructor('en', options)
  var expected = ['localeMatcher', 'numberingSystem', 'style']
  var fields = [
    'years',
    'months',
    'weeks',
    'days',
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
    'microseconds',
    'nanoseconds',
  ]
  for (var unit = 0; unit < fields.length; unit++)
    expected.push(fields[unit], fields[unit] + 'Display')
  expected.push('fractionalDigits')
  check(JSON.stringify(seen) === JSON.stringify(expected))
  check(model.format({seconds: 1, milliseconds: 473}) === '0:00:01.473')
  check(
    new Constructor('fi', {style: 'digital'}).format({
      hours: 1,
      minutes: 2,
      seconds: 3,
    }) === '1.02.03'
  )
  check(
    new Constructor('en', {style: 'digital', fractionalDigits: 2}).format({
      seconds: -1,
      milliseconds: -473,
    }) === '-0:00:01.47'
  )
  var error
  try {
    model.format('PT1H')
  } catch (caught) {
    error = caught
  }
  check(error instanceof RangeError)
  var values = []
  var duration = new Proxy(
    {seconds: 1},
    {
      get: function (target, key) {
        values.push(key)
        return target[key]
      },
    }
  )
  model.format(duration)
  check(
    values.join(',') ===
      'days,hours,microseconds,milliseconds,minutes,months,nanoseconds,seconds,weeks,years'
  )
  Object.defineProperty(Intl, 'NumberFormat', {
    configurable: true,
    get: function () {
      throw new Error('JS NumberFormat callback')
    },
  })
  Object.defineProperty(Intl, 'ListFormat', {
    configurable: true,
    get: function () {
      throw new Error('JS ListFormat callback')
    },
  })
  check(
    new Constructor('en', {style: 'digital'}).format({hours: 1, seconds: 2}) ===
      '1:00:02'
  )
  print('Hermes DurationFormat default runtime passed')
})()
