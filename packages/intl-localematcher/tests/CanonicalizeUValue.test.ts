import {CanonicalizeUValue} from '#packages/intl-localematcher/abstract/CanonicalizeUValue.js'
import {expect, test} from 'vitest'

test.each([
  ['ca', 'ISLAMICC', 'islamic-civil'],
  ['ca', 'ethiopic-amete-alem', 'ethioaa'],
  ['ca', 'ISO8601', 'iso8601'],
  ['ca', '\u0130SO8601', '\u0130so8601'],
  ['ks', 'primary', 'level1'],
  ['kn', 'yes', ''],
  ['kn', 'TRUE', ''],
  ['kn', 'false', 'false'],
  ['sd', 'cn11', 'cnbj'],
  ['rg', 'fi01', 'axzzzz'],
  ['ca', 'unknown', 'unknown'],
  ['ca', 'constructor', 'constructor'],
  ['zz', 'constructor', 'constructor'],
])('canonicalizes %s=%s to %s', (key, value, expected) => {
  expect(CanonicalizeUValue(key, value)).toBe(expected)
})
