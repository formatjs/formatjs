import {runInNewContext} from 'node:vm'
import {expect, it} from 'vitest'
import {OrdinaryHasInstance} from '#packages/ecma262-abstract/OrdinaryHasInstance.js'

it('checks callability and primitive instances before reading prototype', () => {
  const object = new Proxy(
    {},
    {
      get() {
        throw new Error('Non-callable prototype read')
      },
    }
  )
  expect(OrdinaryHasInstance(object, {})).toBe(false)
  const callable = new Proxy(function () {}, {
    get() {
      throw new Error('Primitive instance prototype read')
    },
  })
  for (const value of [undefined, null, false, 0, '', 1n, Symbol()]) {
    expect(OrdinaryHasInstance(callable, value)).toBe(false)
  }
})

it('delegates bound constructors to the target instanceof operation', () => {
  class Target {}
  const instance = new Target()
  const bound = Target.bind(null).bind(null)
  expect(OrdinaryHasInstance(bound, instance)).toBe(true)
  expect(OrdinaryHasInstance(bound, {})).toBe(false)
  const events: unknown[] = []
  Object.defineProperty(Target, Symbol.hasInstance, {
    value(value: unknown) {
      events.push(this, value)
      return value === 23
    },
  })
  // Bound dispatch precedes the primitive-instance shortcut.
  expect(OrdinaryHasInstance(bound, 23)).toBe(true)
  expect(events).toEqual([Target, 23])
})

it('ignores the constructor own hasInstance override', () => {
  class Constructor {}
  Object.defineProperty(Constructor, Symbol.hasInstance, {
    get() {
      throw new Error('OrdinaryHasInstance must not Get @@hasInstance')
    },
  })
  expect(OrdinaryHasInstance(Constructor, new Constructor())).toBe(true)
  expect(OrdinaryHasInstance(Constructor, {})).toBe(false)
})

it('gets constructor prototype once then walks instance prototypes in order', () => {
  const events: string[] = []
  const prototype = Object.create(null)
  const constructor = new Proxy(function () {}, {
    get(_target, key) {
      events.push(String(key))
      if (key !== 'prototype') throw new Error('Unexpected constructor Get')
      return prototype
    },
  })
  const middle = new Proxy(
    {},
    {
      getPrototypeOf() {
        events.push('middle')
        return prototype
      },
    }
  )
  const instance = new Proxy(
    {},
    {
      getPrototypeOf() {
        events.push('instance')
        return middle
      },
      get() {
        throw new Error('Instance properties must not be read')
      },
    }
  )
  expect(OrdinaryHasInstance(constructor, instance)).toBe(true)
  expect(events).toEqual(['prototype', 'instance', 'middle'])
  expect(OrdinaryHasInstance(constructor, prototype)).toBe(false)
})

it('preserves prototype getter and getPrototypeOf abrupt completions', () => {
  const failure = Object.freeze({message: 'prototype stopped'})
  const constructor = new Proxy(function () {}, {
    get() {
      throw failure
    },
  })
  const instance = new Proxy(
    {},
    {
      getPrototypeOf() {
        throw failure
      },
    }
  )
  for (const [target, value] of [
    [constructor, {}],
    [function () {}, instance],
  ] as const) {
    let caught: unknown
    try {
      OrdinaryHasInstance(target, value)
    } catch (error) {
      caught = error
    }
    expect(caught).toBe(failure)
  }
})

it('rejects invalid prototypes before walking the instance', () => {
  const instance = new Proxy(
    {},
    {
      getPrototypeOf() {
        throw new Error('Instance visited before invalid prototype rejection')
      },
    }
  )
  for (const prototype of [undefined, null, false, 0, '', 1n, Symbol()]) {
    const constructor = new Proxy(function () {}, {get: () => prototype})
    expect(() => OrdinaryHasInstance(constructor, instance)).toThrow(TypeError)
  }
  expect(() => OrdinaryHasInstance(() => {}, {})).toThrow(TypeError)
})

it('handles foreign-realm and revoked callable constructors', () => {
  const foreign = runInNewContext('(class Constructor {})')
  expect(OrdinaryHasInstance(foreign.bind(null), new foreign())).toBe(true)
  const revoked = Proxy.revocable(function () {}, {})
  revoked.revoke()
  expect(OrdinaryHasInstance(revoked.proxy, 0)).toBe(false)
  expect(() => OrdinaryHasInstance(revoked.proxy, {})).toThrow(TypeError)
})

it('does not call mutable Object.prototype.isPrototypeOf', () => {
  class Constructor {}
  const instance = new Constructor()
  const original = Object.prototype.isPrototypeOf
  let actual: unknown, error: unknown
  try {
    Object.prototype.isPrototypeOf = () => {
      throw new Error('Mutable prototype helper reached')
    }
    actual = OrdinaryHasInstance(Constructor, instance)
  } catch (caught) {
    error = caught
  } finally {
    Object.prototype.isPrototypeOf = original
  }
  expect(error).toBeUndefined()
  expect(actual).toBe(true)
})
