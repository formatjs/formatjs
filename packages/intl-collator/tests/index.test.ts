import {describe, expect, it} from 'vitest'
import {Collator} from '#packages/intl-collator/index.js'

describe('Intl.Collator', () => {
  it('exposes resolved options', () => {
    expect(
      new Collator('en-u-kn-true-kf-upper', {
        sensitivity: 'base',
        ignorePunctuation: true,
      }).resolvedOptions()
    ).toMatchObject({
      locale: 'en-u-kf-upper-kn',
      usage: 'sort',
      sensitivity: 'base',
      ignorePunctuation: true,
      collation: 'default',
      numeric: true,
      caseFirst: 'upper',
    })
  })

  it('uses search tailoring independently of sort collation options', () => {
    expect(
      ['AE', 'Ä'].sort(new Collator('de', {usage: 'sort'}).compare)
    ).toEqual(['Ä', 'AE'])
    const search = new Collator('de-u-co-phonebk', {
      usage: 'search',
      collation: 'phonebk',
    })
    expect(search.resolvedOptions()).toMatchObject({
      locale: 'de',
      collation: 'default',
      usage: 'search',
    })
    expect(['AE', 'Ä'].sort(search.compare)).toEqual(['AE', 'Ä'])
  })

  it('compares strings with base sensitivity', () => {
    const collator = new Collator('en', {sensitivity: 'base'})
    expect(collator.compare('resume', 'resume')).toBe(0)
    expect(collator.compare('resume', 'résumé')).toBe(0)
    expect(collator.compare('a', 'b')).toBeLessThan(0)
  })

  it('uses root collation data for accent-sensitive comparisons', () => {
    const collator = new Collator('en', {sensitivity: 'accent'})
    expect(collator.compare('resume', 'résumé')).toBeLessThan(0)
  })

  it('uses prefixed root collation entries', () => {
    const collator = new Collator('en')
    expect(collator.compare('l\u00b7', 'lz')).toBeLessThan(0)
  })

  it('compares numeric digit runs', () => {
    const collator = new Collator('en', {numeric: true})
    expect(collator.compare('item2', 'item10')).toBeLessThan(0)
  })

  it('applies caseFirst as a tie breaker', () => {
    expect(
      new Collator('en', {caseFirst: 'upper'}).compare('A', 'a')
    ).toBeLessThan(0)
    expect(
      new Collator('en', {caseFirst: 'lower'}).compare('A', 'a')
    ).toBeGreaterThan(0)
  })

  it('ignores UCA variable punctuation when requested', () => {
    const collator = new Collator('en', {ignorePunctuation: true})
    expect(collator.compare('a\u2014b', 'ab')).toBe(0)
  })

  it('uses the CLDR punctuation default unless explicitly overridden', () => {
    for (const locale of ['th', 'th-TH']) {
      const collator = new Collator(locale)
      expect(collator.resolvedOptions().ignorePunctuation).toBe(true)
      expect(collator.compare('a-b', 'ab')).toBe(0)
      const explicit = new Collator(locale, {ignorePunctuation: false})
      expect(explicit.resolvedOptions().ignorePunctuation).toBe(false)
      expect(explicit.compare('a-b', 'ab')).not.toBe(0)
    }
    for (const locale of ['en', 'ja']) {
      expect(new Collator(locale).resolvedOptions().ignorePunctuation).toBe(
        false
      )
    }
  })

  it('keeps CLDR root out of locale negotiation', () => {
    expect(Collator.availableLocales.has('root')).toBe(false)
    for (const locale of Collator.availableLocales) {
      expect(() => new Intl.Locale(locale)).not.toThrow()
    }
    expect(new Collator(['tlh', 'id', 'en']).resolvedOptions().locale).toBe(
      'id'
    )
  })

  it('applies CLDR language matching only with best fit', () => {
    const requested = ['tlh', 'id']
    // ECMA-402 §9.2.9 step 4.c preserves matching requests.
    // https://tc39.es/ecma402/#sec-filterlocales
    // CLDR languageInfo assigns a one-way match from tlh to en.
    expect(Collator.supportedLocalesOf(requested)).toEqual(requested)
    expect(
      Collator.supportedLocalesOf(requested, {localeMatcher: 'lookup'})
    ).toEqual(['id'])
  })

  it('supports locale filtering', () => {
    expect(Collator.supportedLocalesOf(['en', 'fr', 'sv', 'zz'])).toEqual([
      'en',
      'fr',
      'sv',
    ])
  })

  it('uses canonical collation types for negotiation and tailorings', () => {
    expect(
      new Collator('de-u-co-phonebk', {collation: 'pinyin'}).resolvedOptions()
    ).toMatchObject({locale: 'de-u-co-phonebk', collation: 'phonebk'})
    const phonebook = new Collator('de-u-co-phonebk')
    expect(
      ['A', 'b', 'Af', 'Ab', 'od', 'off', 'Ä', 'ö'].sort(phonebook.compare)
    ).toEqual(['A', 'Ab', 'Ä', 'Af', 'b', 'od', 'ö', 'off'])
    expect(new Collator('es-u-co-trad').resolvedOptions().collation).toBe(
      'trad'
    )
    expect(new Collator('si-u-co-dict').resolvedOptions().collation).toBe(
      'dict'
    )
    expect(new Collator('es-u-co-trad').compare('cz', 'ch')).toBeLessThan(0)
    expect(new Collator('es').compare('cz', 'ch')).toBeGreaterThan(0)
  })

  it('resolves generated collation metadata', () => {
    expect(new Collator('zh-u-co-pinyin').resolvedOptions()).toMatchObject({
      locale: 'zh-u-co-pinyin',
      collation: 'pinyin',
    })
  })

  it('applies imported pinyin tone tailorings', () => {
    const collator = new Collator('zh-u-co-pinyin')
    expect(collator.compare('\u0101', '\u00e1')).toBeLessThan(0)
    expect(collator.compare('\u00e1', '\u01ce')).toBeLessThan(0)
    expect(collator.compare('\u01ce', '\u00e0')).toBeLessThan(0)
    expect(collator.compare('\u00e0', 'a')).toBeLessThan(0)
  })

  it('uses generated CLDR default collation for comparison', () => {
    const collator = new Collator('zh')
    expect(collator.resolvedOptions().collation).toBe('default')
    expect(collator.compare('\u00e0', 'a')).toBeLessThan(0)
  })

  it('applies locale primary tailorings from generated CLDR data', () => {
    const collator = new Collator('sv')
    expect(collator.compare('z', '\u00e5')).toBeLessThan(0)
    expect(collator.compare('\u00e5', '\u00e4')).toBeLessThan(0)
    expect(collator.compare('\u00e4', '\u00f6')).toBeLessThan(0)
  })
})

it('validates collation syntax before resolving support', () => {
  for (const collation of ['!', '', 'ab', 'abc_def', 'abcdefghi']) {
    expect(() => new Collator('en', {collation})).toThrow(RangeError)
  }
  expect(
    new Collator('en', {collation: 'foobar'}).resolvedOptions().collation
  ).toBe('default')
})

it('selects the locale data before reading matcher options', () => {
  const data = Collator.localeData
  const expected = new Collator('en').resolvedOptions().ignorePunctuation
  let reads = 0
  try {
    const formatter = new Collator('en', {
      get localeMatcher() {
        reads++
        if (data) {
          Collator.localeData = {
            ...data,
            en: {...data.en!, ignorePunctuation: !expected},
          }
        }
        return 'lookup' as const
      },
    })
    expect(formatter.resolvedOptions().ignorePunctuation).toBe(expected)
    expect(reads).toBe(1)
    if (data)
      expect(new Collator('en').resolvedOptions().ignorePunctuation).toBe(
        !expected
      )
  } finally {
    if (data) Collator.localeData = data
  }
})

it('compare uses ToString and preserves coercion order', () => {
  const compare = new Collator('en').compare
  expect(() => compare(Symbol('a') as any, 'a')).toThrow(TypeError)
  expect(() => compare('a', Symbol('a') as any)).toThrow(TypeError)
  const calls: string[] = []
  const value = (name: string) => ({
    [Symbol.toPrimitive](hint: string) {
      calls.push(`${name}:${hint}`)
      return 'a'
    },
  })
  expect(compare(value('left') as any, value('right') as any)).toBe(0)
  expect(calls).toEqual(['left:string', 'right:string'])
})

describe('built-in descriptors', () => {
  it('ignores the receiver when called as a function', () => {
    const existing = new Collator('en', {numeric: true})
    const result = Collator.call(existing, 'en')
    expect(result).not.toBe(existing)
    expect(result.resolvedOptions().numeric).toBe(false)
    expect(existing.resolvedOptions().numeric).toBe(true)
  })

  it('uses the new target prototype and checks slots independently of it', () => {
    const prototype = Object.create(null)
    let reads = 0
    const newTarget = new Proxy(function () {}, {
      get(target, key, receiver) {
        if (key === 'prototype') {
          reads++
          return prototype
        }
        return Reflect.get(target, key, receiver)
      },
    })
    const instance = Reflect.construct(Collator, ['en'], newTarget)
    expect(reads).toBe(1)
    expect(Object.getPrototypeOf(instance)).toBe(prototype)
    const getter = Object.getOwnPropertyDescriptor(
      Collator.prototype,
      'compare'
    )!.get!
    expect(getter.call(instance)('a', 'b')).toBeLessThan(0)
    expect(Collator.prototype.resolvedOptions.call(instance).locale).toBe('en')
    const impostor = Object.create(Collator.prototype)
    expect(() => getter.call(impostor)).toThrow(TypeError)
    expect(() => Collator.prototype.resolvedOptions.call(impostor)).toThrow(
      TypeError
    )
  })

  it('creates resolved option properties without invoking inherited setters', () => {
    const instance = new Collator('en', {numeric: true})
    const previous = Object.getOwnPropertyDescriptor(
      Object.prototype,
      'numeric'
    )
    let actual: ReturnType<typeof instance.resolvedOptions>
    try {
      Object.defineProperty(Object.prototype, 'numeric', {
        configurable: true,
        set() {
          throw new Error('called inherited numeric setter')
        },
      })
      actual = instance.resolvedOptions()
    } finally {
      if (previous) Object.defineProperty(Object.prototype, 'numeric', previous)
      else Reflect.deleteProperty(Object.prototype, 'numeric')
    }
    expect(Object.getOwnPropertyDescriptor(actual, 'numeric')?.value).toBe(true)
  })

  it.each([
    ['supportedLocalesOf', Collator, 1],
    ['resolvedOptions', Collator.prototype, 0],
  ] as const)(
    '%s is a writable non-constructor method',
    (name, owner, length) => {
      const descriptor = Object.getOwnPropertyDescriptor(owner, name)!
      expect(descriptor).toMatchObject({
        writable: true,
        enumerable: false,
        configurable: true,
      })
      expect(descriptor.value.name).toBe(name)
      expect(descriptor.value.length).toBe(length)
      expect(Object.hasOwn(descriptor.value, 'prototype')).toBe(false)
      expect(() => Reflect.construct(descriptor.value, [])).toThrow(TypeError)
    }
  )
  it('uses the required getter and bound compare names', () => {
    expect(
      Object.getOwnPropertyDescriptor(Collator.prototype, 'compare')!.get!.name
    ).toBe('get compare')
    const collator = new Collator('en')
    expect(collator.compare.name).toBe('')
    expect(collator.compare).toBe(collator.compare)
    expect(collator.compare('a', 'b')).toBeLessThan(0)
  })
  it('does not allow replacing the constructor prototype', () => {
    expect(
      Object.getOwnPropertyDescriptor(Collator, 'prototype')
    ).toMatchObject({writable: false, enumerable: false, configurable: false})
  })
})

describe('consistent comparison keys', () => {
  it('uses intrinsic case mapping for comparison and case-first keys', () => {
    const turkish = new Collator('tr', {sensitivity: 'base'}).compare
    const upperFirst = new Collator('en', {caseFirst: 'upper'}).compare
    const {toLocaleLowerCase, toLocaleUpperCase} = String.prototype
    let base: number
    let upper: number
    try {
      String.prototype.toLocaleLowerCase = String.prototype.toLocaleUpperCase =
        () => {
          throw new Error('called public case mapping')
        }
      base = turkish('I', 'ı')
      upper = upperFirst('A', 'a')
    } finally {
      String.prototype.toLocaleLowerCase = toLocaleLowerCase
      String.prototype.toLocaleUpperCase = toLocaleUpperCase
    }
    expect(base).toBe(0)
    expect(upper).toBeLessThan(0)
  })

  it('compares a cold tailoring without array species or inherited writes', () => {
    const compare = new Collator('is', {numeric: true}).compare
    const species = Object.getOwnPropertyDescriptor(Array, Symbol.species)!
    const item = Object.getOwnPropertyDescriptor(Array.prototype, '0')
    let actual: number
    try {
      Object.defineProperty(Array, Symbol.species, {
        configurable: true,
        get() {
          throw new Error('read public array species')
        },
      })
      Object.defineProperty(Array.prototype, '0', {
        configurable: true,
        set() {
          throw new Error('called inherited array setter')
        },
      })
      actual = compare('þ2', 'þ10')
    } finally {
      if (item) Object.defineProperty(Array.prototype, '0', item)
      else Reflect.deleteProperty(Array.prototype, '0')
      if (species) Object.defineProperty(Array, Symbol.species, species)
      else Reflect.deleteProperty(Array, Symbol.species)
    }
    expect(actual).toBeLessThan(0)
  })

  it('compares canonical equivalents using intrinsic normalization', () => {
    const collator = new Collator('en')
    const normalize = String.prototype.normalize
    let actual: number
    try {
      String.prototype.normalize = () => {
        throw new Error('called public normalize')
      }
      actual = collator.compare('Å', 'A\u030a')
    } finally {
      String.prototype.normalize = normalize
    }
    expect(actual).toBe(0)
  })

  it('keeps unmatched numeric runs ordered', () => {
    const collator = new Collator('en', {numeric: true})
    expect(collator.compare('x', 'x1')).toBeLessThan(0)
    expect(collator.compare('x', 'x2')).toBeLessThan(0)
    expect(collator.compare('x1', 'x2')).toBeLessThan(0)
    expect(collator.compare('x1', 'x')).toBeGreaterThan(0)
  })
  it('ignores caseFirst for base and accent sensitivity', () => {
    for (const sensitivity of ['base', 'accent'] as const)
      for (const caseFirst of ['upper', 'lower'] as const) {
        const collator = new Collator('en', {sensitivity, caseFirst})
        expect(collator.compare('a', 'A')).toBe(0)
        expect(
          new Intl.Collator('en', {sensitivity, caseFirst}).compare('a', 'A')
        ).toBe(0)
      }
  })
  it('orders canonically equivalent strings consistently with caseFirst', () => {
    for (const caseFirst of ['upper', 'lower'] as const) {
      const collator = new Collator('en', {caseFirst})
      expect(collator.compare('Å', 'A\u030a')).toBe(0)
      expect(Math.sign(collator.compare('å', 'Å'))).toBe(
        Math.sign(collator.compare('å', 'A\u030a'))
      )
      expect(collator.compare('å', 'Å')).not.toBe(0)
      expect(Math.sign(collator.compare('å', 'Å'))).toBe(
        Math.sign(new Intl.Collator('en', {caseFirst}).compare('å', 'Å'))
      )
    }
  })
})

it('defines a consistent comparator across numeric and canonical variants', () => {
  const values = [
    '',
    'x',
    'x1',
    'x2',
    'x01',
    'x-1',
    'x-',
    'a',
    'A',
    'å',
    'Å',
    'A\u030a',
    'a\u0301',
    'á',
    'a-',
    'a-1',
  ]
  for (const sensitivity of ['base', 'accent', 'case', 'variant'] as const)
    for (const numeric of [false, true])
      for (const caseFirst of ['false', 'upper', 'lower'] as const)
        for (const ignorePunctuation of [false, true]) {
          const options = {sensitivity, numeric, caseFirst, ignorePunctuation}
          const model = new Collator('en', options)
          const table = values.map(left =>
            values.map(right => Math.sign(model.compare(left, right)))
          )
          for (let a = 0; a < values.length; a++) {
            expect(Object.is(table[a][a], 0), JSON.stringify(options)).toBe(
              true
            )
            for (let b = 0; b < values.length; b++) {
              expect(
                table[a][b] + table[b][a],
                JSON.stringify({options, a: values[a], b: values[b]})
              ).toBe(0)
              for (let c = 0; c < values.length; c++)
                if (table[a][b] <= 0 && table[b][c] <= 0)
                  expect(
                    table[a][c],
                    JSON.stringify({
                      options,
                      a: values[a],
                      b: values[b],
                      c: values[c],
                    })
                  ).toBeLessThanOrEqual(0)
            }
          }
        }
})

it('reads co/kn/kf in spec order and rejects malformed co before later getters', () => {
  const order: string[] = []
  new Collator('en', {
    get usage() {
      order.push('usage')
      return 'sort' as const
    },
    get localeMatcher() {
      order.push('localeMatcher')
      return 'lookup' as const
    },
    get collation() {
      order.push('collation')
      return 'default'
    },
    get numeric() {
      order.push('numeric')
      return false
    },
    get caseFirst() {
      order.push('caseFirst')
      return 'false' as const
    },
    get sensitivity() {
      order.push('sensitivity')
      return 'variant' as const
    },
    get ignorePunctuation() {
      order.push('ignorePunctuation')
      return false
    },
  })
  expect(order).toEqual([
    'usage',
    'localeMatcher',
    'collation',
    'numeric',
    'caseFirst',
    'sensitivity',
    'ignorePunctuation',
  ])
  expect(
    () =>
      new Collator('en', {
        collation: 'en_US',
        get numeric(): boolean {
          throw new Error('numeric getter before collation validation')
        },
      })
  ).toThrow(RangeError)
})
it('does not retain the default collation sentinel as a Unicode extension', () => {
  for (const collation of ['default', 'standard', 'search']) {
    const model = new Collator('en-u-co-' + collation)
    expect(model.resolvedOptions()).toMatchObject({
      locale: 'en',
      collation: 'default',
    })
    expect(
      new Intl.Collator('en-u-co-' + collation).resolvedOptions()
    ).toMatchObject({locale: 'en', collation: 'default'})
  }
})

it('keeps primary locale tailorings when sensitivity ignores accents', () => {
  for (const sensitivity of ['base', 'case'] as const) {
    const swedish = new Collator('sv', {sensitivity})
    expect(swedish.compare('z', 'ä')).toBeLessThan(0)
    expect(swedish.compare('a', 'ä')).not.toBe(0)
    expect(Math.sign(swedish.compare('z', 'ä'))).toBe(
      Math.sign(new Intl.Collator('sv', {sensitivity}).compare('z', 'ä'))
    )
  }
  expect(
    new Collator('de', {usage: 'search', sensitivity: 'base'}).compare(
      'AE',
      'Ä'
    )
  ).toBe(0)
  expect(new Collator('en', {sensitivity: 'case'}).compare('a', 'á')).toBe(0)
})

it.each(['getDefaultLocale', 'relevantExtensionKeys'] as const)(
  'keeps locale state private from %s',
  property => {
    const original = Object.getOwnPropertyDescriptor(Collator, property)
    try {
      Object.defineProperty(Collator, property, {
        configurable: true,
        get() {
          throw new Error(`Read public ${property}`)
        },
      })
      expect(new Collator('en-u-kn').resolvedOptions().numeric).toBe(true)
    } finally {
      if (original) Object.defineProperty(Collator, property, original)
      else Reflect.deleteProperty(Collator, property)
    }
  }
)
