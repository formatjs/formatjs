// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (nativeSupportedValuesOf: (key: string) => string[] | null) {
  'use strict'
  const defineProperty = Object.defineProperty
  const InvalidKeyError = RangeError
  const root = globalThis as unknown as {Intl?: object}
  if (!root.Intl) root.Intl = {}

  // ECMA-262 built-in functions: method syntax supplies name/length without
  // [[Construct]] or an own prototype. Installation uses native descriptors.
  // https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
  const supportedValuesOf = {
    supportedValuesOf(key: unknown) {
      // Intl.supportedValuesOf step 1: ToString, once, with the string hint.
      // Template conversion also rejects Symbols, unlike the String function.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L103
      const category = `${key}`
      // Steps 2–8: Rust dispatches categories and enumerates supported values.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L104-L122
      const values = nativeSupportedValuesOf(category)
      if (values === null) throw new InvalidKeyError('Invalid key: ' + category)
      // Step 9: JSI has already created a fresh intrinsic Array from Rust's list.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/intl.html#L123
      return values
    },
  }.supportedValuesOf
  defineProperty(root.Intl, 'supportedValuesOf', {
    value: supportedValuesOf,
    writable: true,
    enumerable: false,
    configurable: true,
  })
})
