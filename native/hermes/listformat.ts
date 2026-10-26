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
  const fromCharCode = String.fromCharCode
  const BadReceiver = TypeError
  const BadOption = RangeError
  const slots = new WeakMap<object, object>()
  const getSlot = WeakMap.prototype.get
  const setSlot = WeakMap.prototype.set
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver('Install Intl.getCanonicalLocales before ListFormat')

  function decoded(value: string | number): any {
    if (typeof value === 'number')
      throw new BadOption('Invalid Intl.ListFormat options or locale data')
    return parse(value)
  }
  function quote(value: string): string {
    return stringify(value)!
  }
  function options(value: unknown): any {
    if (value === undefined) return create(null)
    if (value === null) throw new BadReceiver('options must not be null')
    return object(value)
  }
  function option(
    options: any,
    name: string,
    choices: string[],
    fallback: string
  ): string {
    const value = options[name]
    if (value === undefined) return fallback
    const text = `${value}`
    for (let index = 0; index < choices.length; index++)
      if (text === choices[index]) return text
    throw new BadOption('Invalid Intl.ListFormat option: ' + name)
  }
  function isObject(value: unknown): boolean {
    return (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function')
    )
  }
  function slot(receiver: unknown): object {
    const handle = apply(getSlot, slots, [receiver])
    if (!handle) throw new BadReceiver('Incompatible Intl.ListFormat receiver')
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
  function text(units: number[]): string {
    let result = ''
    // Bounded apply avoids argument limits; null-prototype chunks bypass
    // inherited setters. Code units cross the ABI without UTF-8 replacement.
    for (let offset = 0; offset < units.length; offset += 1024) {
      const chunk = create(null)
      let count = 0
      for (; count < 1024 && offset + count < units.length; count++)
        chunk[count] = units[offset + count]
      chunk.length = count
      result += apply(fromCharCode, undefined, chunk)
    }
    return result
  }
  function listJSON(input: unknown): string {
    // StringListFromIterable 1–5: undefined is empty; for-of supplies GetIterator,
    // IteratorStepValue and IteratorClose on a non-string element. Never coerce.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L357-L368
    if (input === undefined) return '[]'
    let result = '[',
      separator = ''
    for (const value of input as Iterable<unknown>) {
      if (typeof value !== 'string')
        throw new BadReceiver('Iterable yielded a non-string value')
      result += separator + '['
      for (let index = 0; index < value.length; index++)
        result += (index ? ',' : '') + apply(charCodeAt, value, [index])
      result += ']'
      separator = ','
    }
    return result + ']'
  }
  // Constructor 1–6: allocate once before ResolveOptions. A derived constructor
  // avoids Hermes allocating from newTarget.prototype before our explicit Get.
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L21-L26
  class ListFormat extends null {
    constructor(
      locales: unknown = undefined,
      optionsInput: unknown = undefined
    ) {
      const requestedPrototype = new.target.prototype
      const receiver = create(
        isObject(requestedPrototype) ? requestedPrototype : prototype
      )
      const requested = apply(canonicalize, intl, [locales]) as string[]
      const opts = options(optionsInput)
      const matcher = option(
        opts,
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      const locale = match(requested, matcher === 'lookup', false) as string
      // Steps 7–14: get/validate type before reading style; Rust selects templates.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L27-L34
      const type = option(
        opts,
        'type',
        ['conjunction', 'disjunction', 'unit'],
        'conjunction'
      )
      const style = option(opts, 'style', ['long', 'short', 'narrow'], 'long')
      const handle = nativeCreate(
        locale,
        '{"type":' + quote(type) + ',"style":' + quote(style) + '}'
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
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L61-L63
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
          throw new BadReceiver('Expected list locale JSON string')
        const status = nativeLoad(packs[index] as string)
        if (status !== 0) decoded(status)
      }
    }
    static getDefaultLocale(): string {
      return decoded(nativeInfo()).default || ''
    }
  }
  const prototype = ListFormat.prototype
  setPrototypeOf(prototype, objectPrototype)
  const members = {
    format(this: unknown, list: unknown): string {
      // Brand check precedes iteration; Rust implements FormatList.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L162-L166
      const handle = slot(this)
      return text(
        decoded(
          nativeQuery(
            handle,
            '{"method":"format","list":' + listJSON(list) + '}'
          )
        )
      )
    },
    formatToParts(this: unknown, list: unknown): object[] {
      // Fresh ordinary array/records; Rust preserves element/literal boundaries.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L335-L344
      const handle = slot(this)
      const parts = decoded(
        nativeQuery(
          handle,
          '{"method":"formatToParts","list":' + listJSON(list) + '}'
        )
      )
      for (let index = 0; index < parts.length; index++)
        parts[index].value = text(parts[index].value)
      return parts
    },
    resolvedOptions(this: unknown): object {
      // Fresh ordinary result, table property order; null descriptors avoid
      // inherited setters and poisoned descriptor getters.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L120-L151
      const values = decoded(
        nativeQuery(slot(this), '{"method":"resolvedOptions"}')
      )
      const result = create(objectPrototype)
      property(result, 'locale', values.locale, true)
      property(result, 'type', values.type, true)
      property(result, 'style', values.style, true)
      return result
    },
  }
  const names: (keyof typeof members)[] = [
    'format',
    'formatToParts',
    'resolvedOptions',
  ]
  for (let index = 0; index < names.length; index++)
    property(prototype, names[index], members[names[index]])
  property(prototype, Symbol.toStringTag, 'Intl.ListFormat', false, false)
  property(ListFormat, 'polyfilled', true)
  const descriptor = create(null)
  descriptor.writable = false
  define(ListFormat, 'prototype', descriptor)
  property(intl, 'ListFormat', ListFormat)
})
