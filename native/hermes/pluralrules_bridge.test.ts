// Exercise the JSI bridge before the public Intl constructor facade is installed.
// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeLoad: (pack: string) => number
  nativeInfo: () => string | number
  nativeMatch: (request: string) => string | number
  nativeCreate: (locale: string, options: string) => object | number
  nativeQuery: (handle: object, request: string) => string | number
  nativeSelect: (handle: object, value: string, bigint: boolean) => number
}) {
  'use strict'
  function equal(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      )
  }
  function parsed(value: string | number): any {
    if (typeof value !== 'string') throw new Error(`Native status ${value}`)
    return JSON.parse(value)
  }
  function handle(options: Record<string, unknown> = {}) {
    const value = native.nativeCreate('en', JSON.stringify(options))
    if (typeof value !== 'object')
      throw new Error(`Native create status ${value}`)
    return value
  }
  function query(value: object, request: Record<string, unknown>) {
    return parsed(native.nativeQuery(value, JSON.stringify(request)))
  }
  equal(parsed(native.nativeInfo()), {available: [], default: null})
  equal(native.nativeCreate('en', '{}'), 1)
  const en = JSON.stringify({
    locale: 'en',
    aliases: ['en-US'],
    cardinal: {one: 'i = 1 and v = 0'},
    ordinal: {
      one: 'n % 10 = 1 and n % 100 != 11',
      two: 'n % 10 = 2 and n % 100 != 12',
      few: 'n % 10 = 3 and n % 100 != 13',
    },
    ranges: {cardinal: {one_other: 'other'}},
  })
  equal(native.nativeLoad(en), 0)
  equal(parsed(native.nativeInfo()), {
    available: ['en', 'en-US'],
    default: 'en',
  })
  equal(
    parsed(
      native.nativeMatch(JSON.stringify({requested: ['en-GB-u-nu-arab']}))
    ),
    'en'
  )
  equal(
    parsed(
      native.nativeMatch(
        JSON.stringify({requested: ['en-GB-u-nu-arab', 'qzz'], supported: true})
      )
    ),
    ['en-GB-u-nu-arab']
  )
  const original = handle()
  equal(native.nativeSelect(original, '1', false), 1)
  equal(native.nativeSelect(original, '2', false), 5)
  equal(native.nativeSelect(original, '9007199254740993', true), 5)
  equal(query(original, {method: 'select', value: '1'}), 'one')
  equal(query(original, {method: 'selectRange', start: '1', end: '2'}), 'other')
  equal(
    native.nativeQuery(
      original,
      JSON.stringify({method: 'selectRange', start: 'NaN', end: '2'})
    ),
    1
  )
  equal(query(original, {method: 'resolvedOptions'}).pluralCategories, [
    'one',
    'other',
  ])
  equal(
    query(handle({type: 'ordinal'}), {
      method: 'select',
      value: '9007199254740993',
    }),
    'few'
  )
  equal(
    native.nativeCreate(
      'en',
      JSON.stringify({roundingIncrement: 2, maximumSignificantDigits: 2})
    ),
    4
  )
  equal(
    query(handle({maximumSignificantDigits: 2, maximumFractionDigits: 'NaN'}), {
      method: 'select',
      value: '1',
    }),
    'one'
  )
  equal(native.nativeLoad('invalid JSON'), 1)
  equal(parsed(native.nativeInfo()).default, 'en')
  equal(
    native.nativeLoad(
      JSON.stringify({locale: 'en', cardinal: {}, ordinal: {}})
    ),
    0
  )
  equal(query(handle(), {method: 'select', value: '1'}), 'other')
  equal(query(original, {method: 'select', value: '1'}), 'one')
  let rejected = false
  try {
    native.nativeQuery({}, '{"method":"resolvedOptions"}')
  } catch {
    rejected = true
  }
  equal(rejected, true)
  ;(globalThis as any).print('Hermes PluralRules bridge passed')
})
