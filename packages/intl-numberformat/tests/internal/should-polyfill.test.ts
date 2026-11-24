import {expect, it} from 'vitest'
import {shouldPolyfill} from '#packages/intl-numberformat/should-polyfill.js'
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en.js'
import {NumberFormat} from '#packages/intl-numberformat/core.js'
import en from '#packages/intl-numberformat/tests/locale-data/en.json' with {type: 'json'}
NumberFormat.__addLocaleData(en as any)

it.each(['formatRange', 'formatRangeToParts', 'formatToParts'] as const)(
  'detects a native formatter without %s',
  method => {
    const original = Intl.NumberFormat
    const descriptor = Object.getOwnPropertyDescriptor(
      NumberFormat.prototype,
      method
    )!
    let complete: string | undefined
    let incomplete: string | undefined
    try {
      ;(Intl as any).NumberFormat = NumberFormat
      complete = shouldPolyfill('en')
      Reflect.deleteProperty(NumberFormat.prototype, method)
      incomplete = shouldPolyfill('en')
    } finally {
      Object.defineProperty(NumberFormat.prototype, method, descriptor)
      Intl.NumberFormat = original
    }
    expect(complete).toBeUndefined()
    expect(incomplete).toBe('en')
  }
)

it('detects missing source precision in native NumberFormat', () => {
  const original = Intl.NumberFormat
  try {
    ;(Intl as any).NumberFormat = NumberFormat
    expect(shouldPolyfill('en')).toBeUndefined()
    ;(Intl as any).NumberFormat = class extends NumberFormat {
      constructor(...args: ConstructorParameters<typeof NumberFormat>) {
        super(...args)
        const format = this.format
        Object.defineProperty(this, 'format', {
          value: (input: any) =>
            format(typeof input === 'string' ? Number(input) : input),
        })
      }
    }
    expect(shouldPolyfill('en')).toBe('en')
  } finally {
    ;(Intl as any).NumberFormat = original
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
  const host = Object.getOwnPropertyDescriptor(Intl, 'NumberFormat')!
  const method = Object.getOwnPropertyDescriptor(
    NumberFormat,
    'supportedLocalesOf'
  )!
  try {
    Object.defineProperty(Intl, 'NumberFormat', {value: NumberFormat})
    expect(shouldPolyfill('en')).toBeUndefined()
    Object.defineProperty(NumberFormat, 'supportedLocalesOf', {
      value: probe,
    })
    expect(shouldPolyfill('en')).toBe('en')
  } finally {
    Object.defineProperty(NumberFormat, 'supportedLocalesOf', method)
    Object.defineProperty(Intl, 'NumberFormat', host)
  }
})
