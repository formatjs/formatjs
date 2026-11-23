import {getCanonicalLocales} from '#packages/intl-getcanonicallocales/index.js'
import {shouldPolyfill} from '#packages/intl-getcanonicallocales/should-polyfill.js'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('native canonicalization detection', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  function installNative(canonicalize: (tag: string) => string[]) {
    vi.stubGlobal(
      'Intl',
      Object.assign(Object.create(Intl), {getCanonicalLocales: canonicalize})
    )
  }

  it('retains a compliant implementation during normal installation', async () => {
    installNative(getCanonicalLocales)
    expect(shouldPolyfill()).toBe(false)
    await import('#packages/intl-getcanonicallocales/polyfill.js')
    expect(Intl.getCanonicalLocales).toBe(getCanonicalLocales)
  })

  it.each([
    ['unknown yes values', 'en-u-aa-yes', 'en-u-aa'],
    ['boolean aliases', 'en-u-kn-yes', 'en-u-kn-yes'],
    ['private-use tags', 'und-x-private', 'x-private'],
  ])(
    'replaces native functions that mishandle %s',
    async (_, input, output) => {
      const broken = (tag: string) =>
        tag === input ? [output] : getCanonicalLocales(tag)
      installNative(broken)
      expect(shouldPolyfill()).toBe(true)
      await import('#packages/intl-getcanonicallocales/polyfill.js')
      expect(Intl.getCanonicalLocales).not.toBe(broken)
      expect(
        Intl.getCanonicalLocales([
          'en-u-aa-yes',
          'en-u-fw-yes',
          'en-u-kn-yes',
          'und-x-private',
        ])
      ).toEqual(['en-u-aa-yes', 'en-u-fw-yes', 'en-u-kn', 'und-x-private'])
    }
  )

  it('replaces an implementation that rejects valid probe tags', async () => {
    installNative(() => {
      throw new RangeError('unsupported tag')
    })
    expect(shouldPolyfill()).toBe(true)
    await import('#packages/intl-getcanonicallocales/polyfill.js')
    expect(Intl.getCanonicalLocales('en-u-aa-yes')).toEqual(['en-u-aa-yes'])
  })

  it.each([undefined, {}])(
    'installs when canonicalization is absent (%s)',
    async intl => {
      vi.stubGlobal('Intl', intl)
      expect(shouldPolyfill()).toBe(true)
      await import('#packages/intl-getcanonicallocales/polyfill.js')
      expect(Intl.getCanonicalLocales('en-u-kn-yes')).toEqual(['en-u-kn'])
    }
  )
})
