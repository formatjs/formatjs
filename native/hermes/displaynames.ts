// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeLoad: (pack: string) => number
  nativeInfo: () => string | number
  nativeMatch: (request: string) => string | number
  nativeCreate: (locale: string, options: string) => object | number
  nativeQuery: (handle: object, request: string) => string | number
}) {
  'use strict'
  const {nativeLoad, nativeInfo, nativeMatch, nativeCreate, nativeQuery} =
    native
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
    if (value === undefined) {
      if (required) throw new BadReceiver('Intl.DisplayNames requires options')
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
  function match(
    requested: string[],
    lookup: boolean,
    supported: boolean
  ): any {
    let tags = '['
    for (let index = 0; index < requested.length; index++)
      tags += (index ? ',' : '') + quote(requested[index])
    return decoded(
      nativeMatch(
        '{"requested":' +
          tags +
          '],"lookup":' +
          lookup +
          ',"supported":' +
          supported +
          '}'
      )
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
  // Constructor 1–6: allocate once before ResolveOptions. A derived constructor
  // avoids Hermes allocating from newTarget.prototype before our explicit Get.
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L21-L25
  class DisplayNames extends null {
    constructor(locales: unknown, optionsInput: unknown) {
      const requestedPrototype = new.target.prototype
      const receiver = create(
        isObject(requestedPrototype) ? requestedPrototype : prototype
      )
      const requested = apply(canonicalize, intl, [locales]) as string[]
      // ResolveOptions requires options for DisplayNames, after locale-list
      // canonicalization and before reading localeMatcher.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L23
      const opts = options(optionsInput, true)
      const matcher = option(
        opts,
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      const locale = match(requested, matcher === 'lookup', false) as string
      // Constructor 6–18: validate style, required type, fallback, then
      // languageDisplay even for non-language types. Rust selects the fields.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L26-L45
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
        locale,
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
      // CanonicalizeLocaleList precedes FilterLocales and its option accesses.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L73-L75
      const requested = apply(canonicalize, intl, [locales]) as string[]
      const matcher = option(
        options(optionsInput),
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      return match(requested, matcher === 'lookup', true)
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
  const prototype = DisplayNames.prototype
  setPrototypeOf(prototype, objectPrototype)
  const members = {
    of(this: unknown, code: unknown): string | undefined {
      // of 1–4: brand before ToString. Template substitution uses string hint
      // and rejects Symbol. Rust validates/canonicalizes the resulting code.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L182-L189
      const handle = slot(this)
      const text = `${code}`
      const value = decoded(
        nativeQuery(handle, '{"method":"of","code":' + codeJSON(text) + '}')
      )
      return value === null ? undefined : value
    },
    resolvedOptions(this: unknown): object {
      // Fresh ordinary result, table property order; null descriptors avoid
      // inherited setters and poisoned descriptor getters.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/displaynames.html#L132-L170
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
  property(prototype, Symbol.toStringTag, 'Intl.DisplayNames', false, false)
  property(DisplayNames, 'polyfilled', true)
  const descriptor = create(null)
  descriptor.writable = false
  define(DisplayNames, 'prototype', descriptor)
  property(intl, 'DisplayNames', DisplayNames)
})
