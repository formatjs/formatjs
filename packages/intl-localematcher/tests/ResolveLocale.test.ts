import {ResolveLocale} from '#packages/intl-localematcher/abstract/ResolveLocale.js'
import {expect, test} from 'vitest'
import {runInNewContext} from 'node:vm'
test('ResolveLocale', function () {
  expect(
    ResolveLocale(
      ['fr', 'en'],
      ['fr-XX', 'en'],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'fr',
    locale: 'fr',
  })

  expect(
    ResolveLocale(
      ['zh-Hant-TW', 'en'],
      ['zh-TW', 'en'],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'zh-Hant-TW',
    locale: 'zh-Hant-TW',
  })

  expect(
    ResolveLocale(
      ['th', 'en'],
      ['th-u-ca-gregory'],
      {localeMatcher: 'best fit'},
      ['ca', 'nu', 'hc'],
      {
        th: {
          nu: ['latn'],
          ca: ['buddhist', 'gregory'],
          hc: ['h23', 'h12'],
        },
      },
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'th',
    locale: 'th-u-ca-gregory',
    nu: 'latn',
    ca: 'gregory',
    hc: 'h23',
  })
})

test('empty requested', function () {
  expect(
    ResolveLocale(
      ['zh-Hant-TW', 'en'],
      [],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'en',
    locale: 'en',
  })
})

test('GH #4384', function () {
  expect(
    ResolveLocale(
      ['en-x-owo', 'en'],
      ['en-x-owo'],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'en-x-owo',
    locale: 'en-x-owo',
  })
})

test('ResolveLocale records ignore inherited extension setters', () => {
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'kn')
  let calls = 0
  let result
  try {
    Object.defineProperty(Object.prototype, 'kn', {
      configurable: true,
      set() {
        calls++
      },
    })
    result = ResolveLocale(
      ['en'],
      ['en-u-kn'],
      {localeMatcher: 'lookup'},
      ['kn'],
      {en: {kn: ['false', 'true']}},
      () => 'en'
    )
  } finally {
    if (previous) Object.defineProperty(Object.prototype, 'kn', previous)
    else Reflect.deleteProperty(Object.prototype, 'kn')
  }
  expect(calls).toBe(0)
  expect(result?.kn).toBe('true')
  expect(result?.locale).toBe('en-u-kn')
})

test('inserts supported keywords before private-use text', () => {
  const locale = 'de-x-u-private'
  expect(
    ResolveLocale(
      [locale],
      ['de-u-co-phonebk-x-u-private'],
      {localeMatcher: 'lookup'},
      ['co'],
      {[locale]: {co: ['default', 'phonebk']}},
      () => locale
    )
  ).toMatchObject({locale: 'de-u-co-phonebk-x-u-private', co: 'phonebk'})
})

test('null defaults clear an overridden Unicode extension', () => {
  const data = {en: {hc: [null, 'h11', 'h12', 'h23', 'h24']}}
  const resolve = (requested: string, hc?: string | null) =>
    ResolveLocale(
      ['en'],
      [requested],
      {localeMatcher: 'lookup', hc},
      ['hc'],
      data,
      () => 'en'
    )
  expect(resolve('en').hc).toBeNull()
  expect(resolve('en-u-hc-h11').locale).toBe('en-u-hc-h11')
  expect(resolve('en-u-hc-h11', null)).toMatchObject({locale: 'en', hc: null})
})

test('canonicalizes calendar aliases before matching supported values', () => {
  expect(
    ResolveLocale(
      ['en'],
      ['en-u-ca-gregory'],
      {localeMatcher: 'lookup', ca: 'ISLAMICC'},
      ['ca'],
      {en: {ca: ['gregory', 'islamic-civil']}},
      () => 'en'
    )
  ).toMatchObject({locale: 'en', ca: 'islamic-civil'})
})

test('supported locale caches track array and Set mutations', () => {
  for (const locales of [['en', 'fr'], new Set(['en', 'fr'])]) {
    const resolve = () =>
      ResolveLocale(
        locales,
        ['de'],
        {localeMatcher: 'best fit'},
        [],
        {},
        () => 'en'
      ).locale
    expect(resolve()).toBe('en')
    if (locales instanceof Set) {
      locales.delete('fr')
      locales.add('de')
    } else locales[1] = 'de'
    expect(resolve()).toBe('de')
    if (locales instanceof Set) locales.delete('de')
    else locales.pop()
    expect(resolve()).toBe('en')
  }
})

test('supports Sets from another realm', () => {
  const locales = runInNewContext('new Set(["en", "fr"])') as Set<string>
  expect(
    ResolveLocale(
      locales,
      ['fr'],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    ).locale
  ).toBe('fr')
})
