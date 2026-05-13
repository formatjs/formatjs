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

  it('supports locale filtering', () => {
    expect(Collator.supportedLocalesOf(['en', 'fr'])).toEqual(['en'])
  })
})
