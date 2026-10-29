// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeLoad: (pack: string) => number
  nativeInfo: () => string | number
  nativeMatch: (request: string) => string | number
  nativeCreate: (locale: string, options: string) => object | number
  nativeQuery: (handle: object, request: string) => string | number
  nativeSelect: (handle: object, value: string, bigint: boolean) => number
  nativeSelectRange: (
    handle: object,
    start: string,
    end: string,
    startBigint: boolean,
    endBigint: boolean
  ) => number
}) {
  'use strict'
  const {
    nativeLoad,
    nativeInfo,
    nativeMatch,
    nativeCreate,
    nativeQuery,
    nativeSelect,
    nativeSelectRange,
  } = native
  const apply = Reflect.apply
  const create = Object.create
  const define = Object.defineProperty
  const object = Object
  const objectPrototype = Object.prototype
  const own = Object.prototype.hasOwnProperty
  const floor = Math.floor
  const parse = JSON.parse
  const stringify = JSON.stringify
  const BadReceiver = TypeError
  const BadOption = RangeError
  const primitiveKey = Symbol.toPrimitive
  const slots = new WeakMap<object, object>()
  const getSlot = WeakMap.prototype.get.bind(slots) as (
    receiver: unknown
  ) => object | undefined
  const setSlot = WeakMap.prototype.set
  const categories = ['zero', 'one', 'two', 'few', 'many', 'other']
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver('Install Intl.getCanonicalLocales before PluralRules')

  function decoded(result: string | number): any {
    if (typeof result === 'number') {
      if (result === 4)
        throw new BadReceiver('Invalid Intl.PluralRules options')
      throw new BadOption('Invalid Intl.PluralRules value or locale data')
    }
    return parse(result)
  }
  function quote(value: string): string {
    return stringify(value)!
  }
  function strings(values: string[]): string {
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
    options: any,
    name: string,
    values: string[],
    fallback: string
  ): string {
    const value = options[name]
    if (value === undefined) return fallback
    const text = `${value}`
    for (let index = 0; index < values.length; index++)
      if (text === values[index]) return text
    throw new BadOption('Invalid Intl.PluralRules option: ' + name)
  }
  function number(
    value: unknown,
    minimum: number,
    maximum: number,
    fallback: number | undefined
  ): number | undefined {
    if (value === undefined) return fallback
    const numeric = +(value as any)
    if (numeric !== numeric || numeric < minimum || numeric > maximum)
      throw new BadOption('Invalid digit option')
    return floor(numeric)
  }
  function initialize(
    receiver: object,
    locale: string,
    options: string
  ): object {
    const handle = nativeCreate(locale, options)
    if (typeof handle === 'number') decoded(handle)
    apply(setSlot, slots, [receiver, handle])
    return receiver
  }
  function slot(receiver: unknown): object {
    const value = getSlot(receiver)
    if (!value) throw new BadReceiver('Incompatible Intl.PluralRules receiver')
    return value
  }
  function isObject(value: unknown): boolean {
    return (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function')
    )
  }
  function primitive(value: any): any {
    if (!isObject(value)) return value
    // ToIntlMathematicalValue 1 delegates ToPrimitive with hint number. Read
    // @@toPrimitive once, then valueOf/toString only when no exotic hook exists.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1652
    const exotic = value[primitiveKey]
    if (exotic !== undefined && exotic !== null) {
      if (typeof exotic !== 'function')
        throw new BadReceiver('Invalid Symbol.toPrimitive')
      const result = apply(exotic, value, ['number'])
      if (isObject(result))
        throw new BadReceiver('Cannot convert object to primitive')
      return result
    }
    const names = ['valueOf', 'toString']
    for (let index = 0; index < names.length; index++) {
      const method = value[names[index]]
      if (typeof method !== 'function') continue
      const result = apply(method, value, [])
      if (!isObject(result)) return result
    }
    throw new BadReceiver('Cannot convert object to primitive')
  }
  function mathematical(value: unknown): {text: string; bigint: boolean} {
    const prim = primitive(value)
    // Steps 2–4: BigInt stays exact; Symbol must throw outside numeric-string
    // parsing. Primitive Numbers use their intrinsic decimal representation.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1653-L1659
    if (typeof prim === 'bigint') return {text: `${prim}`, bigint: true}
    if (typeof prim === 'symbol')
      throw new BadReceiver('Cannot convert Symbol to number')
    const numeric = +prim
    // Classify malformed strings and rounded zeros/infinities in the engine.
    // Retain finite string text for exact Rust parsing; this also avoids passing
    // malformed UTF-16 through JSON when numeric parsing must simply yield NaN.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1660-L1670
    if (
      typeof prim === 'string' &&
      numeric === numeric &&
      numeric !== Infinity &&
      numeric !== -Infinity &&
      numeric !== 0
    )
      return {text: prim, bigint: false}
    return {
      text: numeric === 0 && 1 / numeric === -Infinity ? '-0' : `${numeric}`,
      bigint: false,
    }
  }
  function match(
    requested: string[],
    lookup: boolean,
    supported: boolean
  ): any {
    return decoded(
      nativeMatch(
        '{"requested":' +
          strings(requested) +
          ',"lookup":' +
          lookup +
          ',"supported":' +
          supported +
          '}'
      )
    )
  }
  function data(
    target: object,
    name: PropertyKey,
    value: unknown,
    writable = true
  ) {
    const descriptor = create(null)
    descriptor.value = value
    descriptor.writable = writable
    descriptor.enumerable = false
    descriptor.configurable = true
    define(target, name, descriptor)
  }

  // Constructor 1–6: a derived constructor allocates its own ordinary receiver;
  // read newTarget.prototype exactly once, before locale/option coercion.
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L21-L26
  class PluralRules extends null {
    constructor(
      locales: unknown = undefined,
      optionsInput: unknown = undefined
    ) {
      const requestedPrototype = new.target.prototype
      const receiver = create(
        isObject(requestedPrototype) ? requestedPrototype : prototype
      )
      // ResolveOptions 1–4: locale-list access precedes option coercion/getters.
      // PluralRules has no relevant Unicode extension keys or resolution options.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L303-L318
      const requested = apply(canonicalize, intl, [locales]) as string[]
      const opts = options(optionsInput)
      const matcher = option(
        opts,
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      const locale = match(requested, matcher === 'lookup', false) as string
      // Undefined options expose no getters; Rust resolves all defaults.
      if (optionsInput === undefined) return initialize(receiver, locale, '{}')
      // Constructor 7–13: each enum's coercion/validation precedes the next Get.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L27-L34
      const values: Record<string, string | number | undefined> = create(null)
      values.type = option(opts, 'type', ['cardinal', 'ordinal'], 'cardinal')
      const notation = (values.notation = option(
        opts,
        'notation',
        ['standard', 'scientific', 'engineering', 'compact'],
        'standard'
      ))
      values.compactDisplay = option(
        opts,
        'compactDisplay',
        ['short', 'long'],
        'short'
      )
      // SetNumberFormatDigitOptions 1–11: validate minimumInteger/increment as
      // read, but retain the four precision values without coercing them yet.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L97-L108
      values.minimumIntegerDigits = number(opts.minimumIntegerDigits, 1, 21, 1)
      const minFraction = opts.minimumFractionDigits,
        maxFraction = opts.maximumFractionDigits
      const minSignificant = opts.minimumSignificantDigits,
        maxSignificant = opts.maximumSignificantDigits
      const increment = (values.roundingIncrement = number(
        opts.roundingIncrement,
        1,
        5000,
        1
      )!)
      const increments = [
        1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
      ]
      let valid = false
      for (let index = 0; index < increments.length; index++)
        if (increment === increments[index]) valid = true
      if (!valid) throw new BadOption('Invalid roundingIncrement')
      values.roundingMode = option(
        opts,
        'roundingMode',
        [
          'ceil',
          'floor',
          'expand',
          'trunc',
          'halfCeil',
          'halfFloor',
          'halfExpand',
          'halfTrunc',
          'halfEven',
        ],
        'halfExpand'
      )
      const priority = (values.roundingPriority = option(
        opts,
        'roundingPriority',
        ['auto', 'morePrecision', 'lessPrecision'],
        'auto'
      ))
      values.trailingZeroDisplay = option(
        opts,
        'trailingZeroDisplay',
        ['auto', 'stripIfInteger'],
        'auto'
      )
      // Active precision: inactive values never undergo ToNumber. Validate
      // significant minimum before coercing its maximum; fraction values both
      // use 0..100 before Rust resolves defaults and checks their relation.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L113-L139
      const hasSignificant =
        minSignificant !== undefined || maxSignificant !== undefined
      const hasFraction = minFraction !== undefined || maxFraction !== undefined
      const needSignificant = priority !== 'auto' || hasSignificant
      const needFraction =
        priority !== 'auto' ||
        !(hasSignificant || (!hasFraction && notation === 'compact'))
      if (needSignificant) {
        const minimum = (values.minimumSignificantDigits = number(
          minSignificant,
          1,
          21,
          1
        )!)
        values.maximumSignificantDigits = number(
          maxSignificant,
          minimum,
          21,
          21
        )
      }
      if (needFraction) {
        values.minimumFractionDigits = number(minFraction, 0, 100, undefined)
        values.maximumFractionDigits = number(maxFraction, 0, 100, undefined)
      }
      // Resolve rounding type/priority and increment restrictions in
      // Rust. Install the private brand only after successful initialization.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L140-L161
      // Private options hold validated primitives and cannot inherit toJSON.
      return initialize(receiver, locale, stringify(values)!)
    }
    static supportedLocalesOf(
      locales: unknown,
      optionsInput: unknown = undefined
    ): string[] {
      // supportedLocalesOf 1–3 and FilterLocales: canonicalize before options;
      // Rust returns requested tags, including their Unicode extensions.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L62-L64
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
        const pack = packs[index]
        if (typeof pack !== 'string')
          throw new BadReceiver('Expected plural locale JSON string')
        const status = nativeLoad(pack)
        if (status !== 0) decoded(status)
      }
    }
    static getDefaultLocale(): string {
      return decoded(nativeInfo()).default || ''
    }
  }
  const prototype = PluralRules.prototype
  Object.setPrototypeOf(prototype, objectPrototype)
  const members = {
    select(this: unknown, value: unknown): string {
      // select 1–4: receiver brand precedes ToIntlMathematicalValue.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L220-L223
      const handle = slot(this)
      let result: number
      if (typeof value === 'number') {
        result = nativeSelect(
          handle,
          value === 0 && 1 / value === -Infinity ? '-0' : `${value}`,
          false
        )
      } else {
        const number = mathematical(value)
        result = nativeSelect(handle, number.text, number.bigint)
      }
      if (result < 0) decoded(-result)
      return categories[result]
    },
    selectRange(this: unknown, start: unknown, end: unknown): string {
      // selectRange 1–6: reject either undefined endpoint before coercing either;
      // coerce start, then end, before Rust rejects any resulting NaN.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L233-L238
      const handle = slot(this)
      if (start === undefined || end === undefined)
        throw new BadReceiver('Range endpoints must be defined')
      const first = mathematical(start),
        last = mathematical(end)
      const result = nativeSelectRange(
        handle,
        first.text,
        last.text,
        first.bigint,
        last.bigint
      )
      if (result < 0) decoded(-result)
      return categories[result]
    },
    resolvedOptions(this: unknown): object {
      // resolvedOptions 1–6: fresh ordinary object, fresh category array, and
      // spec table property order. Null descriptors bypass prototype setters.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L112-L127
      const values = decoded(
        nativeQuery(slot(this), '{"method":"resolvedOptions"}')
      )
      const result = create(objectPrototype)
      const names = [
        'locale',
        'type',
        'notation',
        'compactDisplay',
        'minimumIntegerDigits',
        'minimumFractionDigits',
        'maximumFractionDigits',
        'minimumSignificantDigits',
        'maximumSignificantDigits',
        'pluralCategories',
        'roundingIncrement',
        'roundingMode',
        'roundingPriority',
        'trailingZeroDisplay',
      ]
      for (let index = 0; index < names.length; index++) {
        const name = names[index]
        if (apply(own, values, [name])) {
          const descriptor = create(null)
          descriptor.value = values[name]
          descriptor.writable = true
          descriptor.enumerable = true
          descriptor.configurable = true
          define(result, name, descriptor)
        }
      }
      return result
    },
  }
  const names: (keyof typeof members)[] = [
    'select',
    'selectRange',
    'resolvedOptions',
  ]
  for (let index = 0; index < names.length; index++)
    data(prototype, names[index], members[names[index]])
  data(prototype, Symbol.toStringTag, 'Intl.PluralRules', false)
  data(PluralRules, 'polyfilled', true)
  const descriptor = create(null)
  descriptor.writable = false
  define(PluralRules, 'prototype', descriptor)
  data(intl, 'PluralRules', PluralRules)
})
