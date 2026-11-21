import {expect, it} from 'vitest'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'

it.each([
  ['hasOwnProperty', Object.prototype, 'hasOwnProperty'],
  ['call', Function.prototype, 'call'],
  ['bind', Function.prototype, 'bind'],
  ['apply', Reflect, 'apply'],
] as const)(
  'ignores replaced %s while testing an own field',
  (_name, owner, key) => {
    const original = Object.getOwnPropertyDescriptor(owner, key)!
    let actual: boolean[]
    try {
      Object.defineProperty(owner, key, {
        ...original,
        value() {
          throw new Error('Mutable own-property intrinsic reached')
        },
      })
      const record = Object.create({inherited: 1})
      record.own = 2
      actual = [
        HasOwnProperty(record, 'own'),
        HasOwnProperty(record, 'inherited'),
      ]
    } finally {
      Object.defineProperty(owner, key, original)
    }
    expect(actual!).toEqual([true, false])
  }
)

it('checks the own-property descriptor without reading its value', () => {
  const keys: PropertyKey[] = []
  const target = Object.defineProperty({}, 'minute', {
    get() {
      throw new Error('Value getter reached')
    },
  })
  const record = new Proxy(target, {
    getOwnPropertyDescriptor(target, key) {
      keys.push(key)
      return Reflect.getOwnPropertyDescriptor(target, key)
    },
    get() {
      throw new Error('Property Get reached')
    },
  })
  expect(HasOwnProperty(record, 'minute')).toBe(true)
  expect(HasOwnProperty(record, 'second')).toBe(false)
  expect(keys).toEqual(['minute', 'second'])
})
