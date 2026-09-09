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

  it('supports locale filtering', () => {
    expect(Collator.supportedLocalesOf(['en', 'fr', 'sv', 'zz'])).toEqual([
      'en',
      'fr',
      'sv',
    ])
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
