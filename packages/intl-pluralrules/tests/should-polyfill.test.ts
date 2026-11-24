import {expect, it} from 'vitest'
import {shouldPolyfill} from '#packages/intl-pluralrules/should-polyfill.js'
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import {PluralRules} from '#packages/intl-pluralrules/index.js'
import en from '#packages/intl-pluralrules/tests/locale-data/en.js'
PluralRules.__addLocaleData(en)

it('detects missing source precision in native PluralRules', () => {
  const original = Intl.PluralRules
  try {
    ;(Intl as any).PluralRules = PluralRules
    expect(shouldPolyfill('en')).toBeUndefined()
    ;(Intl as any).PluralRules = class extends PluralRules {
      select(input: number | bigint | string) {
        return super.select(typeof input === 'string' ? Number(input) : input)
      }
    }
    expect(shouldPolyfill('en')).toBe('en')
  } finally {
    ;(Intl as any).PluralRules = original
  }
})

it.each([
  ['unavailable', undefined],
  [
    'throwing',
    () => {
      throw new RangeError('Host locale support unavailable')
    },
  ],
] as const)('falls back when the native locale query is %s', (_kind, probe) => {
  const host = Object.getOwnPropertyDescriptor(Intl, 'PluralRules')!
  const method = Object.getOwnPropertyDescriptor(
    PluralRules,
    'supportedLocalesOf'
  )!
  try {
    Object.defineProperty(Intl, 'PluralRules', {value: PluralRules})
    expect(shouldPolyfill('en')).toBeUndefined()
    Object.defineProperty(PluralRules, 'supportedLocalesOf', {value: probe})
    expect(shouldPolyfill('en')).toBe('en')
  } finally {
    Object.defineProperty(PluralRules, 'supportedLocalesOf', method)
    Object.defineProperty(Intl, 'PluralRules', host)
  }
})
