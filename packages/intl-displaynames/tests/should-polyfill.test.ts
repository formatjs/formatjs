import {DisplayNames} from '..'
import {_shouldPolyfillWithoutLocale, shouldPolyfill} from '../should-polyfill'

describe('before polyfill', function () {
  it('should-polyfill should be true', function () {
    // Node 14.9.0/browsers does have this bug
    expect(_shouldPolyfillWithoutLocale()).toBeTruthy()
  })
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
