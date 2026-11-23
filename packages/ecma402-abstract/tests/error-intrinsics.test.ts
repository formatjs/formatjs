import {expect, it} from 'vitest'
import {ToObject} from '#packages/ecma262-abstract/ToObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {ToIntegerIfIntegral} from '#packages/ecma402-abstract/DurationFormat/ToIntegerIfIntegral.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'

it.each([
  ['null object coercion', 'TypeError', () => ToObject(null)],
  [
    'invalid option',
    'RangeError',
    () => GetOption({style: 'invalid'}, 'style', 'string', ['short'], 'short'),
  ],
  ['fractional duration field', 'RangeError', () => ToIntegerIfIntegral(1.5)],
  [
    'invariant diagnostic',
    'Error',
    () => invariant(false, 'Internal invariant'),
  ],
] as const)(
  'retains intrinsic exception identity for %s',
  (_name, name, run) => {
    const original = Object.getOwnPropertyDescriptor(globalThis, name)!
    const prototype = original.value.prototype
    const replacementFailure = {message: 'Mutable error constructor reached'}
    let caught: unknown
    try {
      Object.defineProperty(globalThis, name, {
        ...original,
        value: function () {
          throw replacementFailure
        },
      })
      try {
        run()
      } catch (error) {
        caught = error
      }
    } finally {
      Object.defineProperty(globalThis, name, original)
    }
    expect(Object.getPrototypeOf(caught)).toBe(prototype)
  }
)
