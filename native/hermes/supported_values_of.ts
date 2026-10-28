// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (nativeSupportedValuesOf: (key: string) => string[] | null) {
  'use strict'
  const defineProperty = Object.defineProperty
  const InvalidKeyError = RangeError
  const root = globalThis as unknown as {Intl?: object}
  if (!root.Intl) root.Intl = {}
  const apply = Reflect.apply
  const slice = Array.prototype.slice
  const watched = new WeakMap<
    object,
    {version: number; loaders: Map<string, unknown>}
  >()
  const cached = new Map<
    string,
    {
      constructor: unknown
      prototype: unknown
      version: number
      resolved: unknown
      format: unknown
      values: string[]
    }
  >()

  function constructorFor(category: string): string | undefined {
    if (category === 'calendar' || category === 'timeZone')
      return 'DateTimeFormat'
    if (category === 'collation') return 'Collator'
    if (
      category === 'currency' ||
      category === 'numberingSystem' ||
      category === 'unit'
    )
      return 'NumberFormat'
  }

  // Locale loaders can change supported values after installation.
  function watch(constructor: unknown, name: string | undefined) {
    if (typeof constructor !== 'function') return undefined
    let state = watched.get(constructor)
    if (!state) {
      state = {version: 0, loaders: new Map()}
      watched.set(constructor, state)
    }
    const names =
      name === 'DateTimeFormat'
        ? [
            '__addLocaleData',
            '__addCalendarLocaleData',
            '__addTZData',
            '__addCalendarData',
            '__setDefaultTimeZone',
          ]
        : ['__addLocaleData', '__addUnitData']
    for (const name of names) {
      const descriptor = Object.getOwnPropertyDescriptor(constructor, name)
      if (
        (!descriptor && name in constructor) ||
        (descriptor && !('value' in descriptor))
      )
        return undefined
      const current = descriptor?.value
      if (state.loaders.get(name) === current) continue
      state.version++
      if (typeof current !== 'function') {
        state.loaders.set(name, current)
        continue
      }
      if (!descriptor || (!descriptor.configurable && !descriptor.writable))
        return undefined
      const record = state
      const wrapped = new Proxy(current, {
        apply(target, receiver, args) {
          try {
            return apply(target, receiver, args)
          } finally {
            record.version++
          }
        },
      })
      Object.defineProperty(constructor, name, {...descriptor, value: wrapped})
      state.loaders.set(name, wrapped)
    }
    return state
  }

  // ECMA-262 built-in functions: method syntax supplies name/length without
  // [[Construct]] or an own prototype. Installation uses native descriptors.
  // https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
  const supportedValuesOf = {
    supportedValuesOf(key: unknown) {
      // Intl.supportedValuesOf step 1: ToString, once, with the string hint.
      // Template conversion also rejects Symbols, unlike the String function.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L103
      const category = `${key}`
      const name = constructorFor(category)
      const constructor = name && (root.Intl as any)[name]
      const state = watch(constructor, name)
      const cacheable = state !== undefined
      const prototype =
        typeof constructor === 'function' && constructor.prototype
      const resolvedDescriptor =
        prototype &&
        Object.getOwnPropertyDescriptor(prototype, 'resolvedOptions')
      const resolved = resolvedDescriptor?.value ?? resolvedDescriptor?.get
      const format =
        prototype && Object.getOwnPropertyDescriptor(prototype, 'format')
      const formatMethod = format?.value ?? format?.get
      const previous = cached.get(category)
      if (
        cacheable &&
        previous &&
        previous.constructor === constructor &&
        previous.prototype === prototype &&
        previous.version === state?.version &&
        previous.resolved === resolved &&
        previous.format === formatMethod
      ) {
        return apply(slice, previous.values, [])
      }
      // Steps 2–8: Rust dispatches categories and enumerates supported values.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L104-L122
      const values = nativeSupportedValuesOf(category)
      if (values === null) throw new InvalidKeyError('Invalid key: ' + category)
      if (cacheable)
        cached.set(category, {
          constructor,
          prototype,
          version: state?.version ?? 0,
          resolved,
          format: formatMethod,
          values,
        })
      // Step 9: JSI has already created a fresh intrinsic Array from Rust's list.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L123
      return apply(slice, values, [])
    },
  }.supportedValuesOf
  defineProperty(root.Intl, 'supportedValuesOf', {
    value: supportedValuesOf,
    writable: true,
    enumerable: false,
    configurable: true,
  })
})
