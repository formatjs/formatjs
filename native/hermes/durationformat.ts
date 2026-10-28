// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeLoad: (kind: number, pack: string) => number
  nativeUnits: (pack: string) => number
  nativeInfo: () => string | number
  nativeSupported: (request: string) => string | number
  nativeBegin: (request: string) => object | number
  nativeStyle: (construction: object, value: string) => number
  nativeUnit: (
    construction: object,
    index: number,
    display: boolean,
    value: string
  ) => number
  nativeFinish: (
    construction: object,
    digits: number | undefined
  ) => object | number
  nativeResolved: (handle: object) => string | number
  nativeFormat: (
    handle: object,
    values: number[],
    defined: number,
    mode: number
  ) => string | number
}) {
  'use strict'
  const {
    nativeLoad,
    nativeUnits,
    nativeInfo,
    nativeSupported,
    nativeBegin,
    nativeStyle,
    nativeUnit,
    nativeFinish,
    nativeResolved,
    nativeFormat,
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
  const getSlot = WeakMap.prototype.get,
    setSlot = WeakMap.prototype.set
  const getDescriptor = Object.getOwnPropertyDescriptor
  const integer = Number.isInteger
  const SetConstructor = Set,
    setAdd = Set.prototype.add
  const BadReceiver = TypeError,
    BadOption = RangeError,
    BadData = Error
  const slots = new WeakMap<object, object>()
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver(
      'Install Intl.getCanonicalLocales before DurationFormat'
    )
  const fields = [
    'years',
    'months',
    'weeks',
    'days',
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
    'microseconds',
    'nanoseconds',
  ]
  const readOrder = [3, 4, 8, 7, 5, 1, 9, 6, 2, 0]
  const temporalDuration = root.Temporal?.Duration,
    durationFrom = temporalDuration?.from
  const temporalGetters: ((this: object) => number)[] = []
  if (temporalDuration)
    for (let index = 0; index < fields.length; index++)
      temporalGetters[index] = getDescriptor(
        temporalDuration.prototype,
        fields[index]
      )!.get!
  function check(status: number): void {
    if (status === 0) return
    if (status === 4) throw new BadReceiver('Invalid Intl.DurationFormat value')
    if (status === 5)
      throw new BadData('Missing Intl.DurationFormat dependency data')
    throw new BadOption(
      'Invalid Intl.DurationFormat option, value or locale data'
    )
  }
  function decoded(value: string | number): any {
    if (typeof value === 'number') check(value)
    return parse(value as string)
  }
  function handle(value: object | number): object {
    if (typeof value === 'number') check(value)
    return value as object
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
    choices: string[] | undefined
  ): string | undefined {
    const value = opts[key]
    if (value === undefined) return undefined
    const text = `${value}`
    if (choices === undefined) return text
    for (let index = 0; index < choices.length; index++)
      if (text === choices[index]) return text
    throw new BadOption('Invalid Intl.DurationFormat option: ' + key)
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
  function request(
    locales: string,
    matcher: string | undefined,
    system: string | undefined
  ): string {
    let result = '{"locales":' + locales + ',"options":{'
    if (matcher !== undefined) result += '"localeMatcher":' + quote(matcher)
    if (system !== undefined)
      result +=
        (matcher !== undefined ? ',' : '') +
        '"numberingSystem":' +
        quote(system)
    return result + '}}'
  }
  function optional(value: string | undefined): string {
    return value === undefined ? 'null' : quote(value)
  }
  function slot(receiver: unknown): object {
    const value = apply(getSlot, slots, [receiver])
    if (!value)
      throw new BadReceiver('Incompatible Intl.DurationFormat receiver')
    return value
  }
  function numbers(input: any): {values: number[]; defined: number} {
    if (typeof input === 'string' && durationFrom)
      input = apply(durationFrom, temporalDuration, [input])
    const values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    if (
      input !== null &&
      (typeof input === 'object' || typeof input === 'function')
    ) {
      if (temporalGetters.length) {
        let branded = false
        try {
          values[0] = apply(temporalGetters[0], input, [])
          branded = true
        } catch {
          /* Ordinary records keep their specified getter order. */
        }
        if (branded) {
          for (let index = 1; index < fields.length; index++)
            values[index] = apply(temporalGetters[index], input, [])
          return {values, defined: 1023}
        }
      }
      let defined = 0
      for (let position = 0; position < readOrder.length; position++) {
        const index = readOrder[position],
          value = input[fields[index]]
        if (value !== undefined) {
          const numeric = +value
          if (!integer(numeric))
            throw new BadOption('Duration fields must be finite integers')
          values[index] = numeric
          defined |= 1 << index
        }
      }
      return {values, defined}
    }
    if (typeof input === 'string')
      throw new BadOption('Invalid duration format')
    throw new BadReceiver('Invalid duration')
  }
  function format(receiver: unknown, input: unknown, mode: number): any {
    const model = slot(receiver),
      record = numbers(input)
    return decoded(nativeFormat(model, record.values, record.defined, mode))
  }
  class DurationFormat extends null {
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
      // Match the reference's pre-locale constructor access.
      if (!(receiver instanceof DurationFormat) || !receiver.constructor)
        throw new BadReceiver("Intl.DurationFormat must be called with 'new'")
      const requested = tags(apply(canonicalize, intl, [locales]) as string[])
      const opts = options(optionsInput)
      const matcher = option(opts, 'localeMatcher', ['lookup', 'best fit'])
      const system = option(opts, 'numberingSystem', undefined)
      if (system !== undefined && !unicodeType(system))
        throw new BadOption('Invalid numberingSystem')
      const construction = handle(
        nativeBegin(request(requested, matcher, system))
      )
      check(
        nativeStyle(
          construction,
          optional(
            option(opts, 'style', ['long', 'short', 'narrow', 'digital'])
          )
        )
      )
      for (let index = 0; index < fields.length; index++) {
        check(
          nativeUnit(
            construction,
            index,
            false,
            optional(
              option(opts, fields[index], [
                'long',
                'short',
                'narrow',
                'numeric',
                '2-digit',
              ])
            )
          )
        )
        check(
          nativeUnit(
            construction,
            index,
            true,
            optional(
              option(opts, fields[index] + 'Display', ['always', 'auto'])
            )
          )
        )
      }
      const rawDigits = opts.fractionalDigits
      const digits = rawDigits === undefined ? undefined : +rawDigits
      const model = handle(nativeFinish(construction, digits))
      apply(setSlot, slots, [receiver, model])
      return receiver
    }
    static supportedLocalesOf(
      locales: unknown,
      optionsInput: unknown = undefined
    ): string[] {
      const requested = tags(apply(canonicalize, intl, [locales]) as string[])
      const matcher = option(options(optionsInput), 'localeMatcher', [
        'lookup',
        'best fit',
      ])
      return decoded(nativeSupported(request(requested, matcher, undefined)))
    }
    static __addNumberFormatData(...packs: unknown[]): void {
      load(0, packs)
    }
    static __addListFormatData(...packs: unknown[]): void {
      load(1, packs)
    }
    static __addNumberFormatUnitData(pack: unknown): void {
      if (typeof pack !== 'string')
        throw new BadReceiver('Expected number unit JSON string')
      check(nativeUnits(pack))
    }
    static getDefaultLocale(): string {
      return decoded(nativeInfo()).default
    }
  }
  function load(kind: number, packs: unknown[]): void {
    for (let index = 0; index < packs.length; index++) {
      const pack = packs[index]
      if (typeof pack !== 'string')
        throw new BadReceiver('Expected native locale JSON string')
      check(nativeLoad(kind, pack))
    }
  }
  const prototype = DurationFormat.prototype
  setPrototype(prototype, objectPrototype)
  const methods = {
    format(this: unknown, duration: unknown): string {
      return format(this, duration, 0)
    },
    formatToParts(this: unknown, duration: unknown): object[] {
      return format(this, duration, 1)
    },
    resolvedOptions(this: unknown): object {
      return decoded(nativeResolved(slot(this)))
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
  property(prototype, Symbol.toStringTag, 'Intl.DurationFormat', false, false)
  property(DurationFormat, 'polyfilled', true)
  const available = create(null)
  available.get = methods.getAvailableLocales
  available.configurable = true
  define(DurationFormat, 'availableLocales', available)
  property(intl, 'DurationFormat', DurationFormat)
})
