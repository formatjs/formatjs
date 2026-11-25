// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeLoad: (pack: string) => number
  nativeInfo: () => string | number
  nativeMatch: (request: string) => string | number
  nativeCapture: (request: string) => object | number
  nativeCreate: (snapshot: object, options: string) => object | number
  nativeQuery: (handle: object, request: string) => string | number
}) {
  'use strict'
  const {
    nativeLoad,
    nativeInfo,
    nativeMatch,
    nativeCapture,
    nativeCreate,
    nativeQuery,
  } = native
  const apply = Reflect.apply
  const create = Object.create
  const define = Object.defineProperty
  const setPrototypeOf = Object.setPrototypeOf
  const object = Object
  const objectPrototype = Object.prototype
  const parse = JSON.parse
  const stringify = JSON.stringify
  const charCodeAt = String.prototype.charCodeAt
  const BadReceiver = TypeError
  const BadOption = RangeError
  // ECMA-402 §12.4: the native handle owns the instance's locale and options.
  // https://tc39.es/ecma402/#sec-properties-of-intl-displaynames-instances
  const slots = new WeakMap<object, object>()
  const getSlot = WeakMap.prototype.get
  const setSlot = WeakMap.prototype.set
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver(
      'Install Intl.getCanonicalLocales before DisplayNames'
    )

  function decoded(value: string | number): any {
    if (typeof value === 'number') {
      if (value === 4) throw new BadReceiver('Intl.DisplayNames requires type')
      throw new BadOption(
        'Invalid Intl.DisplayNames code, options or locale data'
      )
    }
    return parse(value)
  }
  function quote(value: string): string {
    return stringify(value)!
  }
  function options(value: unknown, required = false): any {
    // ECMA-402 §9.2.8 steps 2–3 require constructor options to be an object.
    // https://tc39.es/ecma402/#sec-resolveoptions
    if (required) {
      if (!isObject(value))
        throw new BadReceiver('Intl.DisplayNames requires an options object')
      return value
    }
    // §9.2.9 step 1 coerces options for supportedLocalesOf.
    // https://tc39.es/ecma402/#sec-filterlocales
    if (value === undefined) {
      return create(null)
    }
    if (value === null) throw new BadReceiver('options must not be null')
    return object(value)
  }
  function option(
    options: any,
    name: string,
    choices: string[],
    fallback: string | undefined
  ): string | undefined {
    const value = options[name]
    if (value === undefined) return fallback
    const text = `${value}`
    for (let index = 0; index < choices.length; index++)
      if (text === choices[index]) return text
    throw new BadOption('Invalid Intl.DisplayNames option: ' + name)
  }
  function isObject(value: unknown): boolean {
    return (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function')
    )
  }
  function slot(receiver: unknown): object {
    const handle = apply(getSlot, slots, [receiver])
    if (!handle)
      throw new BadReceiver('Incompatible Intl.DisplayNames receiver')
    return handle
  }
  function matchRequest(
    requested: string[],
    lookup: boolean,
    supported: boolean
  ): string {
    let tags = '['
    for (let index = 0; index < requested.length; index++)
      tags += (index ? ',' : '') + quote(requested[index])
    return (
      '{"requested":' +
      tags +
      '],"lookup":' +
      lookup +
      ',"supported":' +
      supported +
      '}'
    )
  }
  function property(
    target: object,
    name: PropertyKey,
    value: unknown,
    enumerable = false,
    writable = true
  ): void {
    const descriptor = create(null)
    descriptor.value = value
    descriptor.writable = writable
    descriptor.enumerable = enumerable
    descriptor.configurable = true
    define(target, name, descriptor)
  }
  function codeJSON(code: string): string {
    // UTF-16 units let Rust reject lone surrogates as invalid codes rather
    // than losing them during UTF-8 conversion or failing JSON decoding.
    let result = '['
    for (let index = 0; index < code.length; index++)
      result += (index ? ',' : '') + apply(charCodeAt, code, [index])
    return result + ']'
  }
  // ECMA-402 §12.1.1 steps 1–6: allocate once before ResolveOptions. A derived constructor
  // avoids Hermes allocating from newTarget.prototype before our explicit Get.
  // https://tc39.es/ecma402/#sec-Intl.DisplayNames
  class DisplayNames extends null {
    constructor(locales: unknown, optionsInput: unknown) {
      const requestedPrototype = new.target.prototype
      const receiver = create(
        isObject(requestedPrototype) ? requestedPrototype : prototype
      )
      const requested = apply(canonicalize, intl, [locales]) as string[]
      // ResolveOptions requires options for DisplayNames, after locale-list
      // canonicalization and before reading localeMatcher.
      // https://tc39.es/ecma402/#sec-resolveoptions
      const opts = options(optionsInput, true)
      const matcher = option(
        opts,
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      const snapshot = nativeCapture(
        matchRequest(requested, matcher === 'lookup', false)
      )
      if (typeof snapshot === 'number') return decoded(snapshot)
      // Steps 6–16: validate style, required type, fallback, then
      // languageDisplay even for non-language types. Rust selects the fields.
      const style = option(opts, 'style', ['narrow', 'short', 'long'], 'long')!
      const type = option(
        opts,
        'type',
        [
          'language',
          'region',
          'script',
          'currency',
          'calendar',
          'dateTimeField',
        ],
        undefined
      )
      if (type === undefined)
        throw new BadReceiver('Intl.DisplayNames requires type')
      const fallback = option(opts, 'fallback', ['code', 'none'], 'code')!
      const languageDisplay = option(
        opts,
        'languageDisplay',
        ['dialect', 'standard'],
        'dialect'
      )!
      const handle = nativeCreate(
        snapshot,
        '{"style":' +
          quote(style) +
          ',"type":' +
          quote(type) +
          ',"fallback":' +
          quote(fallback) +
          ',"languageDisplay":' +
          quote(languageDisplay) +
          '}'
      )
      if (typeof handle === 'number') decoded(handle)
      apply(setSlot, slots, [receiver, handle])
      return receiver
    }
    static supportedLocalesOf(
      locales: unknown,
      optionsInput: unknown = undefined
    ): string[] {
      // ECMA-402 §12.2.2: canonicalize before FilterLocales reads options.
      // https://tc39.es/ecma402/#sec-Intl.DisplayNames.supportedLocalesOf
      const requested = apply(canonicalize, intl, [locales]) as string[]
      const matcher = option(
        options(optionsInput),
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      return decoded(
        nativeMatch(matchRequest(requested, matcher === 'lookup', true))
      )
    }
    static __addLocaleData(...packs: unknown[]): void {
      for (let index = 0; index < packs.length; index++) {
        if (typeof packs[index] !== 'string')
          throw new BadReceiver('Expected display-name locale JSON string')
        const status = nativeLoad(packs[index] as string)
        if (status !== 0) decoded(status)
      }
    }
    static getDefaultLocale(): string {
      return decoded(nativeInfo()).default || ''
    }
  }
  // ECMA-402 §12.3.1: the class supplies the prototype's constructor property.
  // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.constructor
  const prototype = DisplayNames.prototype
  setPrototypeOf(prototype, objectPrototype)
  const members = {
    of(this: unknown, code: unknown): string | undefined {
      // ECMA-402 §12.3.3 steps 1–4: check the slot before ToString. Template substitution uses string hint
      // and rejects Symbol. Rust validates/canonicalizes the resulting code.
      // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.of
      const handle = slot(this)
      const text = `${code}`
      const value = decoded(
        nativeQuery(handle, '{"method":"of","code":' + codeJSON(text) + '}')
      )
      return value === null ? undefined : value
    },
    resolvedOptions(this: unknown): object {
      // ECMA-402 §12.3.2 steps 2–5: fresh result, own properties in table order.
      // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype.resolvedOptions
      const values = decoded(
        nativeQuery(slot(this), '{"method":"resolvedOptions"}')
      )
      const result = create(objectPrototype)
      property(result, 'locale', values.locale, true)
      property(result, 'style', values.style, true)
      property(result, 'type', values.type, true)
      property(result, 'fallback', values.fallback, true)
      if (values.type === 'language')
        property(result, 'languageDisplay', values.languageDisplay, true)
      return result
    },
  }
  const names: (keyof typeof members)[] = ['of', 'resolvedOptions']
  for (let index = 0; index < names.length; index++)
    property(prototype, names[index], members[names[index]])
  // ECMA-402 §12.3.4 https://tc39.es/ecma402/#sec-intl.displaynames.prototype-%symbol.tostringtag%
  property(prototype, Symbol.toStringTag, 'Intl.DisplayNames', false, false)
  property(DisplayNames, 'polyfilled', true)
  // ECMA-402 §12.2.1 fixes the constructor's prototype property.
  // https://tc39.es/ecma402/#sec-Intl.DisplayNames.prototype
  const descriptor = create(null)
  descriptor.writable = false
  define(DisplayNames, 'prototype', descriptor)
  // ECMA-402 §8.2.3 exposes %Intl.DisplayNames% on Intl.
  // https://tc39.es/ecma402/#sec-intl.displaynames-intro
  property(intl, 'DisplayNames', DisplayNames)
})
