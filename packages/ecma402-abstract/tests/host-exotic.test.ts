import {runInThisContext} from 'node:vm'
import {setFlagsFromString} from 'node:v8'
import {expect, it} from 'vitest'
import {ToObject} from '#packages/ecma262-abstract/ToObject.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {GetOptionsObject} from '#packages/ecma402-abstract/GetOptionsObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'

function hostObject(): Record<string, unknown> {
  setFlagsFromString('--allow-natives-syntax')
  try {
    return runInThisContext('%GetUndetectable()') as Record<string, unknown>
  } finally {
    setFlagsFromString('--no-allow-natives-syntax')
  }
}

it.each([
  ['ToObject', ToObject],
  ['CoerceOptionsToObject', CoerceOptionsToObject],
  ['GetOptionsObject', GetOptionsObject],
])(
  '%s preserves a host-exotic object without reading its properties',
  (_name, convert) => {
    const options = hostObject()
    Object.defineProperty(options, 'style', {
      get() {
        throw new Error('Unexpected getter')
      },
    })
    expect(convert(options)).toBe(options)
  }
)

it('reads host-exotic options once with their original receiver', () => {
  const options = hostObject()
  let reads = 0
  Object.defineProperty(options, 'style', {
    get() {
      reads++
      expect(this).toBe(options)
      return 'long'
    },
  })
  expect(
    GetOption(options, 'style', 'string', ['long', 'short'], 'short')
  ).toBe('long')
  expect(reads).toBe(1)
})

it('preserves abrupt completions from host-exotic option getters', () => {
  const options = hostObject()
  const error = new Error('Host option getter')
  Object.defineProperty(options, 'style', {
    get() {
      throw error
    },
  })
  expect(() =>
    GetOption(options, 'style', 'string', undefined, 'short')
  ).toThrow(error)
})
