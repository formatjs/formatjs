// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeLoad: (pack: string) => number
  nativeInfo: () => string | number
  nativeResolve: (request: string) => string | number
  nativeCreate: (request: string) => object | number
  nativeSupported: (request: string) => string | number
  nativeQuery: (handle: object, request: string) => string | number
  nativeFormat: (handle: object, value: number, unit: string) => string | number
  nativeParts: (handle: object, value: number, unit: string) => string | number
}) {
  'use strict'
  const {
    nativeLoad,
    nativeInfo,
    nativeResolve,
    nativeCreate,
    nativeSupported,
    nativeQuery,
    nativeFormat,
    nativeParts,
  } = native
  const apply = Reflect.apply,
    create = Object.create,
    define = Object.defineProperty
  const object = Object,
    objectPrototype = Object.prototype,
    setPrototype = Object.setPrototypeOf
  const parse = JSON.parse,
    stringify = JSON.stringify,
    charCodeAt = String.prototype.charCodeAt
  const SetConstructor = Set,
    setAdd = Set.prototype.add
  const BadReceiver = TypeError,
    BadOption = RangeError
  const slots = new WeakMap<object, object>()
  const getSlot = WeakMap.prototype.get.bind(slots) as (
    receiver: unknown
  ) => object | undefined
  const setSlot = WeakMap.prototype.set.bind(slots)
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver(
      'Install Intl.getCanonicalLocales before RelativeTimeFormat'
    )
  function decoded(value: string | number): any {
    if (typeof value === 'number')
      throw new BadOption(
        'Invalid Intl.RelativeTimeFormat value, unit or locale data'
      )
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
    descriptor.writable = writable
    descriptor.enumerable = enumerable
    descriptor.configurable = true
    define(target, key, descriptor)
  }
  function quote(value: string): string {
    return stringify(value)!
  }
  function tags(values: string[]): string {
    let result = '['
    for (let index = 0; index < values.length; index++)
      result += (index ? ',' : '') + quote(values[index])
    return result + ']'
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
    throw new BadOption('Invalid Intl.RelativeTimeFormat option: ' + key)
  }
  function unicodeType(text: string): boolean {
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
  function slot(receiver: unknown): object {
    const handle = getSlot(receiver)
    if (!handle)
      throw new BadReceiver('Incompatible Intl.RelativeTimeFormat receiver')
    return handle
  }
  function format(
    receiver: unknown,
    value: unknown,
    unit: unknown,
    method: string
  ): any {
    const handle = slot(receiver)
    // ToNumber precedes ToString; both precede nonfinite and unit validation.
    // https://tc39.es/ecma402/#sec-intl-relativetimeformat.prototype.format
    const numeric = +(value as any)
    const text = `${unit}`
    if (method === 'format') {
      const formatted = nativeFormat(handle, numeric, text)
      if (typeof formatted === 'number')
        throw new BadOption('Invalid Intl.RelativeTimeFormat value or unit')
      return formatted
    }
    return decoded(nativeParts(handle, numeric, text))
  }

  class RelativeTimeFormat extends null {
    constructor(
      locales: unknown = undefined,
      optionsInput: unknown = undefined
    ) {
      const requestedPrototype = new.target.prototype
      const receiver = create(
        requestedPrototype !== null &&
          (typeof requestedPrototype === 'object' ||
            typeof requestedPrototype === 'function')
          ? requestedPrototype
          : prototype
      )
      const requested = tags(canonicalize(locales) as string[])
      const opts = options(optionsInput)
      const localeMatcher = option(
        opts,
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      const numberingSystem = option(
        opts,
        'numberingSystem',
        undefined,
        undefined
      )
      if (numberingSystem !== undefined && !unicodeType(numberingSystem))
        throw new BadOption('Invalid numberingSystem')
      const resolution = nativeResolve(
        '{"locales":' +
          requested +
          ',"options":{"localeMatcher":"' +
          localeMatcher +
          '"' +
          (numberingSystem === undefined
            ? ''
            : ',"numberingSystem":"' + numberingSystem + '"') +
          '}}'
      )
      if (typeof resolution === 'number') decoded(resolution)
      // Fields are fetched after these getters, using the earlier locale/nu.
      // https://tc39.es/ecma402/#sec-intl-relativetimeformat-constructor
      const style = option(opts, 'style', ['long', 'short', 'narrow'], 'long')
      const numeric = option(opts, 'numeric', ['always', 'auto'], 'always')
      // Enum choices and Unicode type validation exclude JSON escapes.
      const handle = nativeCreate(
        '{"resolution":' +
          resolution +
          ',"options":{"style":"' +
          style +
          '","numeric":"' +
          numeric +
          '"}}'
      )
      if (typeof handle === 'number') decoded(handle)
      setSlot(receiver, handle)
      return receiver
    }
    static supportedLocalesOf(
      locales: unknown,
      optionsInput: unknown = undefined
    ): string[] {
      const requested = tags(canonicalize(locales) as string[])
      option(
        options(optionsInput),
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      return decoded(nativeSupported(requested))
    }
    static __addLocaleData(...packs: unknown[]): void {
      for (let index = 0; index < packs.length; index++) {
        const pack = packs[index]
        if (typeof pack !== 'string')
          throw new BadReceiver('Expected relative-time locale JSON string')
        const status = nativeLoad(pack)
        if (status !== 0) decoded(status)
      }
    }
    static getDefaultLocale(): string {
      return decoded(nativeInfo()).default || ''
    }
  }
  const prototype = RelativeTimeFormat.prototype
  setPrototype(prototype, objectPrototype)
  const methods = {
    format(this: unknown, value: unknown, unit: unknown): string {
      return format(this, value, unit, 'format')
    },
    formatToParts(this: unknown, value: unknown, unit: unknown): object[] {
      return format(this, value, unit, 'formatToParts')
    },
    resolvedOptions(this: unknown): object {
      return decoded(nativeQuery(slot(this), '{"method":"resolvedOptions"}'))
    },
    getAvailableLocales(): Set<string> {
      const values = decoded(nativeInfo()).available,
        result = new SetConstructor<string>()
      for (let index = 0; index < values.length; index++)
        apply(setAdd, result, [values[index]])
      return result
    },
  }
  const names = ['format', 'formatToParts', 'resolvedOptions'] as const
  for (let index = 0; index < names.length; index++)
    property(prototype, names[index], methods[names[index]])
  property(
    prototype,
    Symbol.toStringTag,
    'Intl.RelativeTimeFormat',
    false,
    false
  )
  property(RelativeTimeFormat, 'polyfilled', true)
  const available = create(null)
  available.get = methods.getAvailableLocales
  available.configurable = true
  define(RelativeTimeFormat, 'availableLocales', available)
  const descriptor = create(null)
  descriptor.writable = false
  define(RelativeTimeFormat, 'prototype', descriptor)
  property(intl, 'RelativeTimeFormat', RelativeTimeFormat)
})
