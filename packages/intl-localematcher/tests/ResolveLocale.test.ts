import {findMatchingDistance} from '#packages/intl-localematcher/abstract/utils.js'
import {ResolveLocale} from '#packages/intl-localematcher/abstract/ResolveLocale.js'
import {expect, test, vi} from 'vitest'
import {runInNewContext} from 'node:vm'

test.each(['lookup', 'best fit'])(
  'uses the loaded host locale as the Intl default with %s',
  localeMatcher => {
    const host = new Intl.Locale(
      new Intl.NumberFormat().resolvedOptions().locale
    )
    const hostLanguage = host.language
    const fallback = hostLanguage === 'fr' ? 'en' : 'fr'
    const locales = new Set([fallback])
    const data = {
      [fallback]: {nu: ['latn']},
      [hostLanguage]: {nu: ['latn', 'arab']},
    }
    const resolve = (requested: string[]) =>
      ResolveLocale(
        locales,
        requested,
        {localeMatcher},
        ['nu'],
        data,
        () => fallback,
        'hostDefaultWithLocaleData'
      )
    expect(resolve([]).locale).toBe(fallback)
    locales.add(hostLanguage)
    const resolved = resolve([])
    expect(resolved.locale).toBe(host.baseName)
    expect(resolved.dataLocale).toBe(hostLanguage)
    expect(resolved.localeData).toBe(data[hostLanguage])
    expect(resolve([host.baseName + '-u-nu-arab']).locale).toBe(
      host.baseName + '-u-nu-arab'
    )
    expect(resolve([fallback]).locale).toBe(fallback)
    locales.delete(hostLanguage)
    expect(resolve([]).locale).toBe(fallback)
  }
)

test('late bundles retain the default after host formatters are replaced', async () => {
  const {NumberFormat, DateTimeFormat} = Intl
  const hostLocale = new NumberFormat().resolvedOptions().locale
  const fallback = hostLocale === 'fr' ? 'en' : 'fr'
  try {
    Object.defineProperty(Intl, 'NumberFormat', {
      value: class extends NumberFormat {
        static polyfilled = true
      },
    })
    Object.defineProperty(Intl, 'DateTimeFormat', {
      value: class extends DateTimeFormat {
        static polyfilled = true
      },
    })
    vi.resetModules()
    const {ResolveLocale: resolve} =
      await import('#packages/intl-localematcher/abstract/ResolveLocale.js')
    expect(
      resolve(
        [fallback, hostLocale],
        [],
        {localeMatcher: 'lookup'},
        [],
        undefined,
        () => fallback,
        'hostDefaultWithLocaleData'
      ).locale
    ).toBe(hostLocale)
  } finally {
    Intl.NumberFormat = NumberFormat
    Intl.DateTimeFormat = DateTimeFormat
  }
})

test('uses the next host formatter when inspecting the first one throws', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'Intl')!
  const broken = Proxy.revocable(Intl.NumberFormat, {})
  broken.revoke()
  try {
    Object.defineProperty(globalThis, 'Intl', {
      value: {
        NumberFormat: broken.proxy,
        DateTimeFormat: class {
          resolvedOptions() {
            return {locale: 'fr-CA-u-nu-latn'}
          }
        },
      },
    })
    vi.resetModules()
    const {ResolveLocale: resolve} =
      await import('#packages/intl-localematcher/abstract/ResolveLocale.js')
    expect(
      resolve(
        ['en', 'fr'],
        [],
        {localeMatcher: 'lookup'},
        [],
        undefined,
        () => 'en',
        'hostDefaultWithLocaleData'
      )
    ).toMatchObject({locale: 'fr-CA', dataLocale: 'fr'})
  } finally {
    Object.defineProperty(globalThis, 'Intl', original)
    vi.resetModules()
  }
})

test.each(['read', 'write'])(
  'uses the host default when the shared cache %s throws',
  async operation => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'Intl')!
    const cacheKey = Symbol.for('@formatjs/intlHostDefaultLocale')
    const host = {
      NumberFormat: class {
        resolvedOptions() {
          return {locale: 'fr-CA-u-nu-latn'}
        }
      },
    }
    const intl = new Proxy(host, {
      getOwnPropertyDescriptor(target, key) {
        if (key === cacheKey && operation === 'read') throw new Error('read')
        return Reflect.getOwnPropertyDescriptor(target, key)
      },
      defineProperty(target, key, descriptor) {
        if (key === cacheKey && operation === 'write') throw new Error('write')
        return Reflect.defineProperty(target, key, descriptor)
      },
    })
    try {
      Object.defineProperty(globalThis, 'Intl', {value: intl})
      vi.resetModules()
      const {ResolveLocale: resolve} =
        await import('#packages/intl-localematcher/abstract/ResolveLocale.js')
      expect(
        resolve(
          ['en', 'fr'],
          [],
          {localeMatcher: 'lookup'},
          [],
          undefined,
          () => 'en',
          'hostDefaultWithLocaleData'
        )
      ).toMatchObject({locale: 'fr-CA', dataLocale: 'fr'})
    } finally {
      Object.defineProperty(globalThis, 'Intl', original)
      vi.resetModules()
    }
  }
)

test('a script-specific host locale also supports its scriptless region', async () => {
  const OriginalIntl = Intl
  const hostLocale = 'az-Latn-AZ'
  let resolve: typeof ResolveLocale
  try {
    Object.defineProperty(globalThis, 'Intl', {
      value: {
        NumberFormat: class {
          resolvedOptions() {
            return {locale: hostLocale}
          }
        },
      },
    })
    vi.resetModules()
    ;({ResolveLocale: resolve} =
      await import('#packages/intl-localematcher/abstract/ResolveLocale.js'))
  } finally {
    Object.defineProperty(globalThis, 'Intl', {value: OriginalIntl})
    vi.resetModules()
  }
  const supported = new Set(['az', 'az-Latn'])
  const latin = {nu: ['latn']}
  const region = {nu: ['arab']}
  const data = {az: latin, 'az-Latn': latin, 'az-AZ': region}
  const lookup = (...requested: string[]) =>
    resolve(
      supported,
      requested,
      {localeMatcher: 'lookup'},
      ['nu'],
      data,
      () => 'az',
      'hostDefaultWithLocaleData'
    )
  expect(lookup().locale).toBe(hostLocale)
  expect(lookup('az-AZ')).toMatchObject({locale: 'az-AZ', localeData: latin})
  supported.add('az-AZ')
  expect(lookup('az-AZ')).toMatchObject({locale: 'az-AZ', localeData: region})
  expect(lookup().localeData).toBe(latin)
})

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

test('returns the same locale record used to negotiate extension values', () => {
  const selected = {nu: ['latn', 'arab']}
  let reads = 0
  const result = ResolveLocale(
    ['en'],
    ['en-u-nu-arab'],
    {localeMatcher: 'lookup'},
    ['nu'],
    {
      get en() {
        return reads++ === 0 ? selected : {nu: ['latn']}
      },
    },
    () => 'en',
    'includeLocaleData'
  )

  // ECMA-402 §9.2.7 steps 6 and 11 use the same record.
  // https://tc39.es/ecma402/#sec-resolvelocale
  expect(result.nu).toBe('arab')
  expect(result.localeData).toBe(selected)
  expect(reads).toBe(1)
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

test('same-size locale reorder preserves first canonical match and its data', () => {
  for (const locales of [['en', 'EN', 'fr'], new Set(['en', 'EN', 'fr'])]) {
    const resolve = () =>
      ResolveLocale(
        locales,
        ['en-u-nu-arab'],
        {localeMatcher: 'best fit'},
        ['nu'],
        {en: {nu: ['latn']}, EN: {nu: ['arab']}, fr: {nu: ['latn']}},
        () => 'fr'
      )
    expect(resolve()).toMatchObject({dataLocale: 'en', nu: 'latn'})
    if (locales instanceof Set) {
      Set.prototype.delete.call(locales, 'en')
      Set.prototype.add.call(locales, 'en')
    } else locales.push(locales.shift()!)
    expect(resolve()).toMatchObject({dataLocale: 'EN', nu: 'arab'})
  }
})

test('switches lookup and best fit after Set snapshots change', () => {
  const locales = new Set(['en', 'fr'])
  const resolve = (localeMatcher: string, requested: string) =>
    ResolveLocale(locales, [requested], {localeMatcher}, [], {}, () => 'en')
      .dataLocale
  expect(resolve('lookup', 'fr')).toBe('fr')
  expect(resolve('best fit', 'fr')).toBe('fr')
  locales.delete('fr')
  locales.add('de')
  expect(resolve('lookup', 'de')).toBe('de')
  expect(resolve('best fit', 'de')).toBe('de')
  locales.delete('en')
  locales.add('fr')
  expect(resolve('best fit', 'fr')).toBe('fr')
  expect(resolve('lookup', 'fr')).toBe('fr')
})

test('private snapshot records ignore inherited snapshot accessors', () => {
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'snapshot')
  let calls = 0
  let result
  try {
    Object.defineProperty(Object.prototype, 'snapshot', {
      configurable: true,
      get() {
        calls++
        return ['de']
      },
      set() {
        calls++
      },
    })
    result = ResolveLocale(
      new Set(['en', 'fr']),
      ['fr'],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  } finally {
    if (previous) Object.defineProperty(Object.prototype, 'snapshot', previous)
    else delete (Object.prototype as {snapshot?: unknown}).snapshot
  }
  expect(calls).toBe(0)
  expect(result).toMatchObject({dataLocale: 'fr'})
})

test.each(['includes', 'indexOf'] as const)(
  'retains locale list search %s after prototype replacement',
  name => {
    const original = Object.getOwnPropertyDescriptor(Array.prototype, name)!
    let actual: unknown
    try {
      Object.defineProperty(Array.prototype, name, {
        ...original,
        value() {
          throw new Error('Mutable locale list search reached')
        },
      })
      actual = [
        ResolveLocale(
          ['en'],
          ['en-u-ca-gregory'],
          {localeMatcher: 'lookup'},
          ['ca'],
          {en: {ca: ['buddhist', 'gregory']}},
          () => 'en'
        ).ca,
        findMatchingDistance('es-CO', 'es-419'),
      ]
    } finally {
      Object.defineProperty(Array.prototype, name, original)
    }
    expect(actual).toEqual(['gregory', 4])
  }
)
