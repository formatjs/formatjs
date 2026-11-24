// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeMatch: (request: string) => string | number
  nativeCreate: (locale: string, options: string) => object | number
  nativeResolved: (handle: object) => string | number
  nativeSegment: (handle: object, input: string) => object | number
  nativeContaining: (handle: object, index: number) => number[] | undefined
  nativeCursor: (handle: object) => object | number
  nativeNext: (handle: object) => number[] | undefined
}) {
  'use strict'
  const {
    nativeMatch,
    nativeCreate,
    nativeResolved,
    nativeSegment,
    nativeContaining,
    nativeCursor,
    nativeNext,
  } = native
  const apply = Reflect.apply
  const create = Object.create
  const define = Object.defineProperty
  const setPrototypeOf = Object.setPrototypeOf
  const getPrototypeOf = Object.getPrototypeOf
  const object = Object
  const objectPrototype = Object.prototype
  const parse = JSON.parse
  const stringify = JSON.stringify
  const slice = String.prototype.slice
  const trunc = Math.trunc
  const BadReceiver = TypeError
  const BadOption = RangeError
  const iteratorSymbol: typeof Symbol.iterator = Symbol.iterator
  const tagSymbol: typeof Symbol.toStringTag = Symbol.toStringTag
  // ECMA-402 §19.6.2 uses %Iterator.prototype%. Get it from a generator.
  // https://tc39.es/ecma402/#sec-%intlsegmentiteratorprototype%-object
  // ECMA-262 §27.8.1 https://tc39.es/ecma262/#sec-properties-of-generator-prototype
  const generatorPrototype = getPrototypeOf(function* () {}.prototype)
  const iteratorPrototype = getPrototypeOf(generatorPrototype)
  const getSlot = WeakMap.prototype.get
  const setSlot = WeakMap.prototype.set
  // ECMA-402 §19.4: the native handle owns locale and granularity.
  // https://tc39.es/ecma402/#sec-properties-of-intl-segmenter-instances
  const models = new WeakMap<object, object>()
  interface State {
    handle: object
    owner: object
    input: string
  }
  // ECMA-402 §§19.5.3 and 19.6.3 retain the original Segments and cursor state.
  // https://tc39.es/ecma402/#sec-properties-of-segments-instances
  // https://tc39.es/ecma402/#sec-properties-of-segment-iterator-instances
  const segments = new WeakMap<object, State>()
  const cursors = new WeakMap<object, State>()
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver('Install Intl.getCanonicalLocales before Segmenter')

  function decoded(value: string | number): any {
    if (typeof value === 'number')
      throw new BadOption('Invalid Intl.Segmenter options or locale')
    return parse(value)
  }
  function handle(value: object | number): object {
    if (typeof value === 'number') decoded(value)
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
    descriptor.enumerable = enumerable
    descriptor.writable = writable
    descriptor.configurable = true
    define(target, key, descriptor)
  }
  function slot<T>(map: WeakMap<object, T>, receiver: unknown): T {
    const value = apply(getSlot, map, [receiver])
    if (!value) throw new BadReceiver('Incompatible Intl.Segmenter receiver')
    return value
  }
  // ResolveOptions uses GetOptionsObject; FilterLocales uses CoerceOptionsToObject.
  // https://tc39.es/ecma402/#sec-resolveoptions
  // https://tc39.es/ecma402/#sec-filterlocales
  function options(value: unknown, strict = false): any {
    if (value === undefined) return create(null)
    if (
      value === null ||
      (strict && typeof value !== 'object' && typeof value !== 'function')
    )
      throw new BadReceiver('options must be an object')
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
    throw new BadOption('Invalid Intl.Segmenter option: ' + name)
  }
  function match(
    requested: string[],
    lookup: boolean,
    supported: boolean
  ): any {
    let tags = '['
    for (let index = 0; index < requested.length; index++)
      tags += (index ? ',' : '') + stringify(requested[index])
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
  function record(
    value: number[] | undefined,
    input: string
  ): object | undefined {
    if (value === undefined) return undefined
    // CreateSegmentDataObject: ordinary record, specified property order, original input.
    // https://tc39.es/ecma402/#sec-createsegmentdataobject
    const segment = apply(slice, input, [value[0], value[1]])
    const index = value[0]
    return value[2] === -1
      ? {segment, index, input}
      : {segment, index, input, isWordLike: value[2] === 1}
  }
  // ECMA-402 §19.1.1: read prototype, canonicalize, resolve, then read granularity.
  // https://tc39.es/ecma402/#sec-intl.segmenter
  class Segmenter extends null {
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
      const requested = apply(canonicalize, intl, [locales]) as string[]
      const opts = options(optionsInput, true)
      const matcher = option(
        opts,
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      const locale = match(requested, matcher === 'lookup', false) as string
      const granularity = option(
        opts,
        'granularity',
        ['grapheme', 'word', 'sentence'],
        'grapheme'
      )
      const model = handle(
        nativeCreate(locale, '{"granularity":' + stringify(granularity) + '}')
      )
      apply(setSlot, models, [receiver, model])
      return receiver
    }
    static supportedLocalesOf(
      locales: unknown,
      optionsInput: unknown = undefined
    ): string[] {
      // CanonicalizeLocaleList precedes FilterLocales and option access.
      // https://tc39.es/ecma402/#sec-intl.segmenter.supportedlocalesof
      const requested = apply(canonicalize, intl, [locales]) as string[]
      const matcher = option(
        options(optionsInput),
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      return match(requested, matcher === 'lookup', true)
    }
  }
  // ECMA-402 §19.3.1: class syntax supplies the prototype's constructor.
  // https://tc39.es/ecma402/#sec-intl.segmenter.prototype.constructor
  const prototype = Segmenter.prototype
  setPrototypeOf(prototype, objectPrototype)
  // ECMA-402 §19.5.2 and §19.6.2 use distinct intrinsic prototypes.
  // https://tc39.es/ecma402/#sec-%intlsegmentsprototype%-object
  // https://tc39.es/ecma402/#sec-%intlsegmentiteratorprototype%-object
  const segmentsPrototype = create(objectPrototype)
  const cursorPrototype = create(iteratorPrototype)
  const members = {
    segment(this: unknown, input: unknown): object {
      // Brand before ToString; keep original JS Segmenter alive through Segments.
      // https://tc39.es/ecma402/#sec-intl.segmenter.prototype.segment
      const model = slot(models, this)
      const value = `${input}`
      const result = create(segmentsPrototype)
      apply(setSlot, segments, [
        result,
        {
          handle: handle(nativeSegment(model, value)),
          owner: this,
          input: value,
        },
      ])
      return result
    },
    resolvedOptions(this: unknown): object {
      // Fresh ordinary result with locale/granularity in table order.
      // https://tc39.es/ecma402/#sec-intl.segmenter.prototype.resolvedoptions
      const values = decoded(nativeResolved(slot(models, this)))
      const result = create(objectPrototype)
      property(result, 'locale', values.locale, true)
      property(result, 'granularity', values.granularity, true)
      return result
    },
  }
  const segmentMembers = {
    containing(this: unknown, index: unknown): object | undefined {
      // Brand then ToIntegerOrInfinity. Truncate before bounds: -0.5 becomes -0.
      // Unary + rejects BigInt (including coercion hooks) and Symbol.
      // https://tc39.es/ecma402/#sec-%intlsegmentsprototype%.containing
      const state = slot(segments, this)
      const number = +(index as any)
      const position = number !== number ? 0 : trunc(number)
      if (position < 0 || position >= state.input.length) return undefined
      return record(nativeContaining(state.handle, position), state.input)
    },
    [iteratorSymbol](this: unknown): object {
      // Independent cursor retains original constructing Segmenter and input.
      // ECMA-402 §19.6.1 initializes the cursor at zero.
      // https://tc39.es/ecma402/#sec-%intlsegmentsprototype%-%symbol.iterator%
      // https://tc39.es/ecma402/#sec-createsegmentiterator
      const state = slot(segments, this)
      const result = create(cursorPrototype)
      apply(setSlot, cursors, [
        result,
        {
          handle: handle(nativeCursor(state.handle)),
          owner: state.owner,
          input: state.input,
        },
      ])
      return result
    },
  }
  const cursorMembers = {
    next(this: unknown): object {
      // Each step returns fresh ordinary {value, done}; exhaustion stays exhausted.
      // https://tc39.es/ecma402/#sec-%intlsegmentiteratorprototype%.next
      const state = slot(cursors, this)
      const value = record(nativeNext(state.handle), state.input)
      return {value, done: value === undefined}
    },
  }
  property(prototype, 'segment', members.segment)
  property(prototype, 'resolvedOptions', members.resolvedOptions)
  // ECMA-402 §19.3.4 https://tc39.es/ecma402/#sec-intl.segmenter.prototype-%symbol.tostringtag%
  property(prototype, tagSymbol, 'Intl.Segmenter', false, false)
  property(segmentsPrototype, 'containing', segmentMembers.containing)
  property(segmentsPrototype, iteratorSymbol, segmentMembers[iteratorSymbol])
  property(cursorPrototype, 'next', cursorMembers.next)
  // https://tc39.es/ecma402/#sec-%intlsegmentiteratorprototype%.%symbol.tostringtag%
  property(
    cursorPrototype,
    tagSymbol,
    'Segmenter String Iterator',
    false,
    false
  )
  property(Segmenter, 'polyfilled', true)
  // ECMA-402 §19.2.1 fixes the constructor's prototype property.
  // https://tc39.es/ecma402/#sec-intl.segmenter.prototype
  const descriptor = create(null)
  descriptor.writable = false
  define(Segmenter, 'prototype', descriptor)
  property(intl, 'Segmenter', Segmenter)
})
