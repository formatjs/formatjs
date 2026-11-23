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

test.each([
  ['hasOwnProperty', Object.prototype, 'hasOwnProperty'],
  ['call', Function.prototype, 'call'],
] as const)(
  'retains Unicode alias matching with replaced %s',
  (_name, owner, key) => {
    const original = Object.getOwnPropertyDescriptor(owner, key)!
    let actual: string[]
    try {
      Object.defineProperty(owner, key, {
        ...original,
        value() {
          throw new Error('Mutable alias own-property method reached')
        },
      })
      actual = [
        CanonicalizeUValue('ca', 'ISLAMICC'),
        CanonicalizeUValue('sd', 'cn11'),
        CanonicalizeUValue('kn', 'yes'),
      ]
    } finally {
      Object.defineProperty(owner, key, original)
    }
    expect(actual!).toEqual(['islamic-civil', 'cnbj', ''])
  }
)
