import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {GetOptionsObject} from '#packages/ecma402-abstract/GetOptionsObject.js'
import {GetStringOrBooleanOption} from '#packages/ecma402-abstract/GetStringOrBooleanOption.js'
import {expect, it} from 'vitest'

it('reads callable options without invoking them', () => {
  let reads = 0
  const options = Object.defineProperty(
    () => {
      throw new Error('called')
    },
    'style',
    {
      get() {
        reads++
        return 'short'
      },
    }
  ) as (() => never) & {style: string}
  expect(GetOptionsObject(options)).toBe(options)
  expect(reads).toBe(0)
  expect(GetOption(options, 'style', 'string', ['short', 'long'], 'long')).toBe(
    'short'
  )
  expect(reads).toBe(1)
})

it('preserves errors from callable option getters', () => {
  const error = new Error('getter')
  const options = Object.defineProperty(() => {}, 'style', {
    get() {
      throw error
    },
  }) as (() => void) & {style: string}
  expect.assertions(1)
  try {
    GetOption(options, 'style', 'string', undefined, 'long')
  } catch (caught) {
    expect(caught).toBe(error)
  }
})

it.each([null, true, 1, 'short', BigInt(1), Symbol('option')])(
  'rejects non-object options: %s',
  value => {
    expect(() => GetOptionsObject(value as never)).toThrow(TypeError)
  }
)

it('creates fresh empty options when omitted', () => {
  const options = GetOptionsObject()
  expect(Object.getPrototypeOf(options)).toBe(null)
  expect(Reflect.ownKeys(options)).toEqual([])
  expect(GetOptionsObject()).not.toBe(options)
})

it('allocates default options without calling the global Object.create', () => {
  const create = Object.create
  let options: object
  try {
    Object.create = () => {
      throw new Error('visible Object.create')
    }
    options = GetOptionsObject()
  } finally {
    Object.create = create
  }
  expect(Object.getPrototypeOf(options)).toBeNull()
})

it('coerces boolean options without calling the global Boolean', () => {
  const boolean = globalThis.Boolean
  let numeric: unknown
  let grouping: string | boolean
  try {
    globalThis.Boolean = (() => {
      throw new Error('visible Boolean')
    }) as BooleanConstructor
    numeric = GetOption(
      {numeric: 'false'},
      'numeric',
      'boolean',
      undefined,
      false
    )
    grouping = GetStringOrBooleanOption(
      {useGrouping: ''},
      'useGrouping',
      ['auto'],
      'auto',
      false,
      'auto'
    )
  } finally {
    globalThis.Boolean = boolean
  }
  expect(numeric).toBe(true)
  expect(grouping).toBe(false)
})

it('accepts any string when GetOption has an empty allowed list', () => {
  expect(GetOption({style: 'short'}, 'style', 'string', [], 'long')).toBe(
    'short'
  )
})
