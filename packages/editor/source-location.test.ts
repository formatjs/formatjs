import {describe, expect, it} from 'vitest'
import {
  formatSourceLocation,
  resolveSourceLocationHref,
  type SourceLocation,
} from '#packages/editor/index.js'

const BASE = 'https://git.example.com/{repository}/blob/{revision}'
const located: SourceLocation = {
  file: 'src/app/home.tsx',
  start: 12,
  end: 18,
  repository: 'acme/web',
  revision: 'abc123',
}

describe('source locations', () => {
  it('formats file-only, start, range, and end-only locations as plain text', () => {
    expect(formatSourceLocation({file: 'a.ts'})).toBe('a.ts')
    expect(formatSourceLocation({file: 'a.ts', start: 4})).toBe('a.ts:4')
    expect(formatSourceLocation({file: 'a.ts', start: 4, end: 9})).toBe(
      'a.ts:4–9'
    )
    expect(formatSourceLocation({file: 'a.ts', end: 9})).toBe('a.ts:9')
    expect(
      formatSourceLocation({...located, source: 'main'}).includes('http')
    ).toBe(false)
  })

  it('produces no link without a base and never from metadata alone', () => {
    expect(resolveSourceLocationHref(located)).toBeUndefined()
    expect(resolveSourceLocationHref(located, {})).toBeUndefined()
    expect(resolveSourceLocationHref(located, {baseUrl: ''})).toBeUndefined()
    expect(
      resolveSourceLocationHref(located, {baseUrl: () => undefined})
    ).toBeUndefined()
    expect(
      resolveSourceLocationHref({...located, file: './'}, {baseUrl: BASE})
    ).toBeUndefined()
  })

  it('builds file, start, and range links from a fixed base', () => {
    const baseUrl = 'https://git.example.com/acme/web/blob/main/'
    expect(resolveSourceLocationHref({file: 'src/home.tsx'}, {baseUrl})).toBe(
      'https://git.example.com/acme/web/blob/main/src/home.tsx'
    )
    expect(
      resolveSourceLocationHref({file: './src/home.tsx', start: 12}, {baseUrl})
    ).toBe('https://git.example.com/acme/web/blob/main/src/home.tsx#L12')
    expect(
      resolveSourceLocationHref(
        {file: '/src/home.tsx', start: 12, end: 12},
        {baseUrl}
      )
    ).toBe('https://git.example.com/acme/web/blob/main/src/home.tsx#L12')
    expect(
      resolveSourceLocationHref(
        {file: 'src/home.tsx', start: 12, end: 18},
        {baseUrl}
      )
    ).toBe('https://git.example.com/acme/web/blob/main/src/home.tsx#L12-L18')
    expect(
      resolveSourceLocationHref({file: 'src/home.tsx', end: 18}, {baseUrl})
    ).toBe('https://git.example.com/acme/web/blob/main/src/home.tsx')
  })

  it('fills repository and revision placeholders from the location or fallbacks', () => {
    expect(resolveSourceLocationHref(located, {baseUrl: BASE})).toBe(
      'https://git.example.com/acme/web/blob/abc123/src/app/home.tsx#L12-L18'
    )
    const bare = {file: 'src/app/home.tsx', start: 3}
    expect(resolveSourceLocationHref(bare, {baseUrl: BASE})).toBeUndefined()
    expect(
      resolveSourceLocationHref(bare, {baseUrl: BASE, repository: 'acme/web'})
    ).toBeUndefined()
    expect(
      resolveSourceLocationHref(bare, {
        baseUrl: BASE,
        repository: 'acme/web',
        revision: 'release/2.0',
      })
    ).toBe(
      'https://git.example.com/acme/web/blob/release/2.0/src/app/home.tsx#L3'
    )
    expect(
      resolveSourceLocationHref(
        {...located, revision: undefined},
        {baseUrl: BASE, revision: 'main'}
      )
    ).toBe(
      'https://git.example.com/acme/web/blob/main/src/app/home.tsx#L12-L18'
    )
  })

  it('encodes path segments and supports resolver and fragment overrides', () => {
    expect(
      resolveSourceLocationHref(
        {file: 'src/Ünïcode dir/#page.tsx', start: 2, end: 5},
        {
          baseUrl: location =>
            location.source === 'release'
              ? 'https://git.example.com/acme/web/blob/release'
              : 'https://git.example.com/acme/web/blob/main',
          lineFragment: (start, end) => `lines-${start}:${end ?? start}`,
        }
      )
    ).toBe(
      'https://git.example.com/acme/web/blob/main/src/%C3%9Cn%C3%AFcode%20dir/%23page.tsx#lines-2:5'
    )
    expect(
      resolveSourceLocationHref(
        {file: 'src/home.tsx', source: 'release'},
        {
          baseUrl: location =>
            `https://git.example.com/acme/web/blob/${location.source}`,
        }
      )
    ).toBe('https://git.example.com/acme/web/blob/release/src/home.tsx')
  })
})
