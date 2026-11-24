import {DisplayNames} from '#packages/intl-displaynames/index.js'
import {
  _shouldPolyfillWithoutLocale,
  shouldPolyfill,
} from '#packages/intl-displaynames/should-polyfill.js'
import {describe, expect, it, test, beforeEach, afterEach} from 'vitest'
test('should-polyfill should be true', function () {
  // Node 14.9.0/browsers does have this bug
  expect(_shouldPolyfillWithoutLocale()).toBeTruthy()
})

describe('after polyfill', function () {
  let NativeDisplayNames: typeof DisplayNames
  beforeEach(function () {
    NativeDisplayNames = (Intl as any).DisplayNames
    ;(Intl as any).DisplayNames = DisplayNames
  })
  afterEach(function () {
    ;(Intl as any).DisplayNames = NativeDisplayNames
  })
  it('should fix the bug', function () {
    expect(_shouldPolyfillWithoutLocale()).toBeFalsy()
  })
})

test('GH #4267', function () {
  expect(shouldPolyfill('fr')).toBe('fr')
})

it('returns a locale pack when the native locale query throws', () => {
  const host = Object.getOwnPropertyDescriptor(Intl, 'DisplayNames')!
  const method = Object.getOwnPropertyDescriptor(
    DisplayNames,
    'supportedLocalesOf'
  )!
  try {
    Object.defineProperty(Intl, 'DisplayNames', {value: DisplayNames})
    Object.defineProperty(DisplayNames, 'supportedLocalesOf', {
      value() {
        throw new RangeError('Host locale support unavailable')
      },
    })
    expect(shouldPolyfill('fr')).toBe('fr')
  } finally {
    Object.defineProperty(DisplayNames, 'supportedLocalesOf', method)
    Object.defineProperty(Intl, 'DisplayNames', host)
  }
})
