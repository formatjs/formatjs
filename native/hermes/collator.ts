// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeResolve: (request: string) => string | number
  nativeCreate: (request: string) => object | number
  nativeSupported: (request: string) => string | number
  nativeQuery: (handle: object, query: string) => string | number
  nativeCompare: (handle: object, left: string, right: string) => number
}) {
  'use strict'
  const {
    nativeResolve,
    nativeCreate,
    nativeSupported,
    nativeQuery,
    nativeCompare,
  } = native
  const apply = Reflect.apply
  const create = Object.create
  const define = Object.defineProperty
  const object = Object
  const objectPrototype = Object.prototype
  const parse = JSON.parse
  const stringify = JSON.stringify
  const charCodeAt = String.prototype.charCodeAt
  const ProxyConstructor = Proxy
  const BadReceiver = TypeError
  const BadOption = RangeError
  const getSlot = WeakMap.prototype.get
  const setSlot = WeakMap.prototype.set
  // ECMA-402 §10.4: native collation state and the cached [[BoundCompare]].
  // https://tc39.es/ecma402/#sec-properties-of-intl-collator-instances
  interface State {
    handle: object
    bound: ((x: unknown, y: unknown) => number) | undefined
  }
  const slots = new WeakMap<object, State>()
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver('Install Intl.getCanonicalLocales before Collator')
  function decoded(value: string | number): any {
    if (typeof value === 'number')
      throw new BadOption('Invalid Intl.Collator locale or options')
    return parse(value)
  }
  function property(
    target: object,
    key: PropertyKey,
    value: unknown,
    enumerable = false,
    writable = true
  ): void {
    const descriptor = create(null)
    descriptor.value = value
    descriptor.enumerable = enumerable
    descriptor.writable = writable
    descriptor.configurable = true
    define(target, key, descriptor)
  }
  function state(receiver: unknown): State {
    const value = apply(getSlot, slots, [receiver])
    if (!value) throw new BadReceiver('Incompatible Intl.Collator receiver')
    return value
  }
  function options(value: unknown): any {
    if (value === undefined) return create(null)
    if (value === null) throw new BadReceiver('options must not be null')
    return object(value)
  }
  function option(
    opts: any,
    key: string,
    choices: string[] | undefined,
    fallback: string | undefined
  ): string | undefined {
    const value = opts[key]
    if (value === undefined) return fallback
    const text = `${value}`
    if (choices === undefined) return text
    for (let index = 0; index < choices.length; index++)
      if (text === choices[index]) return text
    throw new BadOption('Invalid Intl.Collator option: ' + key)
  }
  function booleanOption(
    opts: any,
    key: string,
    fallback: boolean | undefined
  ): boolean | undefined {
    const value = opts[key]
    return value === undefined ? fallback : !!value
  }
  function tags(requested: string[]): string {
    let result = '['
    for (let index = 0; index < requested.length; index++)
      result += (index ? ',' : '') + stringify(requested[index])
    return result + ']'
  }
  function request(locales: string, options: object): string {
    return '{"locales":' + locales + ',"options":' + stringify(options) + '}'
  }
  function unicodeType(text: string): boolean {
    // ResolveOptions rejects malformed co immediately, before kn/kf getters.
    // ASCII type subtags contain 3–8 letters/digits, separated by hyphens.
    // https://tc39.es/ecma402/#sec-resolveoptions
    let length = 0
    for (let index = 0; index < text.length; index++) {
      const code = apply(charCodeAt, text, [index]) as number
      if (code === 45) {
        if (length < 3 || length > 8) return false
        length = 0
      } else {
        if (
          !(
            (code >= 48 && code <= 57) ||
            (code >= 65 && code <= 90) ||
            (code >= 97 && code <= 122)
          )
        )
          return false
        length++
      }
    }
    return length >= 3 && length <= 8
  }
  function initialize(
    locales: unknown,
    optionsInput: unknown,
    newTarget: any
  ): object {
    // Collator is callable. Get the requested prototype exactly once before
    // canonicalization; a construct trap avoids Hermes preallocating a receiver.
    // https://tc39.es/ecma402/#sec-intl.collator
    const requestedPrototype = newTarget.prototype
    const receiver = create(
      requestedPrototype !== null &&
        (typeof requestedPrototype === 'object' ||
          typeof requestedPrototype === 'function')
        ? requestedPrototype
        : prototype
    )
    const requested = tags(apply(canonicalize, intl, [locales]) as string[])
    const opts = options(optionsInput)
    const record = create(null)
    record.usage = option(opts, 'usage', ['sort', 'search'], 'sort')
    record.localeMatcher = option(
      opts,
      'localeMatcher',
      ['lookup', 'best fit'],
      'best fit'
    )
    // ResolveOptions descriptor order: co, kn, kf. Boolean conversion never
    // invokes user coercion hooks; string conversion uses hint string.
    // https://tc39.es/ecma402/#sec-intl-collator-internal-slots
    const collation = option(opts, 'collation', undefined, undefined)
    if (collation !== undefined) {
      if (!unicodeType(collation))
        throw new BadOption('Invalid Intl.Collator collation')
      record.collation = collation
    }
    const numeric = booleanOption(opts, 'numeric', undefined)
    if (numeric !== undefined) record.numeric = numeric
    const caseFirst = option(
      opts,
      'caseFirst',
      ['upper', 'lower', 'false'],
      undefined
    )
    if (caseFirst !== undefined) record.caseFirst = caseFirst
    const defaults = decoded(nativeResolve(request(requested, record)))
    // ResolveLocale precedes locale-dependent sensitivity/punctuation defaults.
    // Rust resolves co/kn/kf and performs the actual UCA/LDML comparisons.
    // https://tc39.es/ecma402/#sec-intl.collator
    record.sensitivity = option(
      opts,
      'sensitivity',
      ['base', 'accent', 'case', 'variant'],
      defaults.sensitivity
    )
    record.ignorePunctuation = booleanOption(
      opts,
      'ignorePunctuation',
      defaults.ignorePunctuation
    )
    const handle = nativeCreate(request(requested, record))
    if (typeof handle === 'number') decoded(handle)
    const value = create(null) as State
    value.handle = handle as object
    value.bound = undefined
    apply(setSlot, slots, [receiver, value])
    return receiver
  }
  let Collator: any = function (
    locales: unknown = undefined,
    optionsInput: unknown = undefined
  ): object {
    return initialize(locales, optionsInput, Collator)
  }
  const prototype = Collator.prototype
  Collator = new ProxyConstructor(Collator, {
    construct(_target, args, newTarget): object {
      return initialize(
        args.length > 0 ? args[0] : undefined,
        args.length > 1 ? args[1] : undefined,
        newTarget
      )
    },
  })
  // ECMA-402 §10.3.1 exposes the installed constructor on the prototype.
  // https://tc39.es/ecma402/#sec-intl.collator.prototype.constructor
  property(prototype, 'constructor', Collator)
  property(Collator, 'name', 'Collator', false, false)
  const methods = {
    supportedLocalesOf(
      locales: unknown,
      optionsInput: unknown = undefined
    ): string[] {
      // Canonicalization precedes FilterLocales option accesses.
      // https://tc39.es/ecma402/#sec-intl.collator.supportedlocalesof
      const requested = tags(apply(canonicalize, intl, [locales]) as string[])
      const matcher = option(
        options(optionsInput),
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      return decoded(
        nativeSupported(
          '{"locales":' +
            requested +
            ',"lookup":' +
            (matcher === 'lookup') +
            '}'
        )
      )
    },
    resolvedOptions(this: unknown): object {
      // Fresh ordinary object, table order, own data properties.
      // https://tc39.es/ecma402/#sec-intl.collator.prototype.resolvedoptions
      const values = decoded(
        nativeQuery(state(this).handle, '{"method":"resolvedOptions"}')
      )
      const result = create(objectPrototype)
      const names = [
        'locale',
        'usage',
        'sensitivity',
        'ignorePunctuation',
        'collation',
        'numeric',
        'caseFirst',
      ]
      for (let index = 0; index < names.length; index++)
        property(result, names[index], values[names[index]], true)
      return result
    },
    getCompare(this: unknown): (x: unknown, y: unknown) => number {
      // Brand first. Cache a non-constructor function tied to this instance;
      // its caller-supplied receiver is ignored.
      // https://tc39.es/ecma402/#sec-intl.collator.prototype.compare
      const value = state(this)
      if (value.bound === undefined) {
        const compare = (x: unknown, y: unknown): number => {
          // ToString(x) precedes ToString(y); Symbols throw. Units preserve
          // lone surrogates through the borrowed UTF-16 boundary.
          // https://tc39.es/ecma402/#sec-collator-compare-functions
          const left = `${x}`
          const right = `${y}`
          return nativeCompare(state(this).handle, left, right)
        }
        property(compare, 'name', '', false, false)
        value.bound = compare
      }
      return value.bound
    },
  }
  property(methods.getCompare, 'name', 'get compare', false, false)
  const descriptor = create(null)
  descriptor.get = methods.getCompare
  descriptor.enumerable = false
  descriptor.configurable = true
  define(prototype, 'compare', descriptor)
  property(prototype, 'resolvedOptions', methods.resolvedOptions)
  // ECMA-402 §10.3.4 https://tc39.es/ecma402/#sec-intl.collator.prototype-%symbol.tostringtag%
  property(prototype, Symbol.toStringTag, 'Intl.Collator', false, false)
  property(Collator, 'supportedLocalesOf', methods.supportedLocalesOf)
  property(Collator, 'polyfilled', true)
  // ECMA-402 §10.2.1 fixes the constructor's prototype property.
  // https://tc39.es/ecma402/#sec-intl.collator.prototype
  const prototypeDescriptor = create(null)
  prototypeDescriptor.writable = false
  define(Collator, 'prototype', prototypeDescriptor)
  // ECMA-402 §8.2.1 exposes %Intl.Collator% on Intl.
  // https://tc39.es/ecma402/#sec-intl.collator-intro
  property(intl, 'Collator', Collator)
})
