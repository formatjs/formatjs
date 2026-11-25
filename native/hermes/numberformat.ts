// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  fallbackSymbol: symbol
  nativeLoad: (pack: string) => number
  nativeUnits: (request: string) => number
  nativeInfo: () => string | number
  nativeSupported: (request: string) => string | number
  nativeResolve: (request: string) => object | number
  nativeCreate: (resolved: object, options: string) => object | number
  nativeQuery: (handle: object, request: string) => string | number
}) {
  'use strict'
  const {
    fallbackSymbol,
    nativeLoad,
    nativeUnits,
    nativeInfo,
    nativeSupported,
    nativeResolve,
    nativeCreate,
    nativeQuery,
  } = native
  const apply = Reflect.apply
  const create = Object.create
  const define = Object.defineProperty
  const object = Object
  const objectPrototype = Object.prototype
  const own = Object.prototype.hasOwnProperty
  const isPrototypeOf = Object.prototype.isPrototypeOf
  const floor = Math.floor
  const parse = JSON.parse
  const stringify = JSON.stringify
  const charCodeAt = String.prototype.charCodeAt
  const upper = String.prototype.toUpperCase
  const indexOf = String.prototype.indexOf
  const slice = String.prototype.slice
  const numberValueOf = Number.prototype.valueOf
  const bigIntPrototype =
    typeof BigInt === 'function' ? BigInt.prototype : undefined
  const bigIntValueOf = bigIntPrototype?.valueOf
  const ProxyConstructor = Proxy
  const SetConstructor = Set
  const setAdd = Set.prototype.add
  const BadReceiver = TypeError
  const BadOption = RangeError
  const primitiveKey = Symbol.toPrimitive
  const getSlot = WeakMap.prototype.get
  const setSlot = WeakMap.prototype.set
  interface State {
    handle: object
    bound: ((value: unknown) => string) | undefined
  }
  const slots = new WeakMap<object, State>()
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver(
      'Install Intl.getCanonicalLocales before NumberFormat'
    )
  function decoded(result: string | number): any {
    if (typeof result === 'number') {
      if (result === 4)
        throw new BadReceiver('Invalid Intl.NumberFormat options')
      throw new BadOption('Invalid Intl.NumberFormat value or locale data')
    }
    return parse(result)
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
  // ECMA-402 §9.2.11 reads the property before coercing or applying a default.
  // https://tc39.es/ecma402/#sec-getoption
  function option(
    opts: any,
    name: string,
    choices: string[] | undefined,
    fallback: string | undefined
  ): string | undefined {
    const value = opts[name]
    if (value === undefined) return fallback
    const text = `${value}`
    if (choices === undefined) return text
    for (let index = 0; index < choices.length; index++)
      if (text === choices[index]) return text
    throw new BadOption('Invalid Intl.NumberFormat option: ' + name)
  }
  // ECMA-402 §§9.2.13–14: callers read the option, then coerce, bound, and floor it.
  // https://tc39.es/ecma402/#sec-defaultnumberoption
  // https://tc39.es/ecma402/#sec-getnumberoption
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
  type Values = Record<string, string | number | boolean | undefined>
  function record(values: Values, names: string[]): string {
    let result = '{',
      separator = ''
    for (let index = 0; index < names.length; index++) {
      const name = names[index],
        value = values[name]
      if (value === undefined) continue
      result +=
        separator +
        quote(name) +
        ':' +
        (typeof value === 'string' ? quote(value) : `${value}`)
      separator = ','
    }
    return result + '}'
  }
  function state(receiver: unknown): State {
    const value = apply(getSlot, slots, [receiver])
    if (!value) throw new BadReceiver('Incompatible Intl.NumberFormat receiver')
    return value
  }
  function unicodeType(text: string): boolean {
    // ASCII type subtags contain 3–8 letters/digits, separated by hyphens.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/negotiation.html#L306-L314
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
  function isObject(value: unknown): boolean {
    return (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function')
    )
  }
  function primitive(value: any): any {
    if (!isObject(value)) return value
    // ECMA-402 §16.5.15 step 1 delegates ToPrimitive with hint number. Read
    // @@toPrimitive once, then valueOf/toString only when no exotic hook exists.
    // https://tc39.es/ecma402/#sec-tointlmathematicalvalue
    // https://tc39.es/ecma262/#sec-toprimitive
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
  function mathematical(value: unknown): {
    text: string
    bigint: boolean
    string: boolean
  } {
    const prim = primitive(value)
    // Steps 2–4: BigInt stays exact; Symbol must throw outside numeric-string
    // parsing. Primitive Numbers use their intrinsic decimal representation.
    // https://tc39.es/ecma402/#sec-tointlmathematicalvalue
    if (typeof prim === 'bigint')
      return {text: `${prim}`, bigint: true, string: false}
    if (typeof prim === 'symbol')
      throw new BadReceiver('Cannot convert Symbol to number')
    const numeric = +prim
    // ECMA-402 §16.5.14: Rust evaluates valid numeric strings at source precision.
    // https://tc39.es/ecma402/#sec-runtime-semantics-stringintlmv
    if (typeof prim === 'string' && numeric === numeric)
      return {text: prim, bigint: false, string: true}
    return {
      text: numeric === 0 && 1 / numeric === -Infinity ? '-0' : `${numeric}`,
      bigint: false,
      string: false,
    }
  }
  const metadata = decoded(nativeInfo())
  // ECMA-402 §6.6.2 tests single IDs against the sanctioned set.
  // https://tc39.es/ecma402/#sec-issanctionedsingleunitidentifier
  const units = create(null)
  for (let index = 0; index < metadata.units.length; index++)
    units[metadata.units[index]] = true
  // ECMA-402 §6.6.1 allows a single ID or exactly two IDs split at "-per-".
  // https://tc39.es/ecma402/#sec-iswellformedunitidentifier
  // https://tc39.es/ecma402/#sec-string-split-to-list
  function validUnit(unit: string): boolean {
    if (units[unit] === true) return true
    const position = apply(indexOf, unit, ['-per-']) as number
    return (
      position >= 0 &&
      units[apply(slice, unit, [0, position])] === true &&
      units[apply(slice, unit, [position + 5])] === true
    )
  }
  const valueNames = [
    'style',
    'currency',
    'currencyDisplay',
    'currencySign',
    'unit',
    'unitDisplay',
    'notation',
    'minimumIntegerDigits',
    'minimumFractionDigits',
    'maximumFractionDigits',
    'minimumSignificantDigits',
    'maximumSignificantDigits',
    'roundingIncrement',
    'roundingMode',
    'roundingPriority',
    'trailingZeroDisplay',
    'compactDisplay',
    'useGrouping',
    'signDisplay',
  ]
  function configured(seed: object, values: Values): object {
    const result = nativeCreate(seed, record(values, valueNames))
    if (typeof result === 'number') decoded(result)
    return result as object
  }
  function initialize(
    locales: unknown,
    optionsInput: unknown,
    newTarget: any
  ): object {
    // ECMA-402 §16.1.1: allocate before locale and option coercion.
    // The construct trap prevents Hermes from reading the prototype twice.
    // https://tc39.es/ecma402/#sec-intl.numberformat
    const requestedPrototype = newTarget.prototype
    const receiver = create(
      isObject(requestedPrototype) ? requestedPrototype : prototype
    )
    const requested = tags(apply(canonicalize, intl, [locales]) as string[])
    const opts = options(optionsInput)
    const resolution = create(null)
    resolution.localeMatcher = option(
      opts,
      'localeMatcher',
      ['lookup', 'best fit'],
      'best fit'
    )
    resolution.numberingSystem = option(
      opts,
      'numberingSystem',
      undefined,
      undefined
    )
    if (
      resolution.numberingSystem !== undefined &&
      !unicodeType(resolution.numberingSystem)
    )
      throw new BadOption('Invalid numberingSystem')
    const resolved = nativeResolve(
      '{"locales":' +
        requested +
        ',"options":' +
        record(resolution, ['localeMatcher', 'numberingSystem']) +
        '}'
    )
    if (typeof resolved === 'number') decoded(resolved)
    const seed = resolved as object
    const values: Values = create(null)
    // ECMA-402 §16.1.3 reads style, currency, and unit options in order.
    // https://tc39.es/ecma402/#sec-setnumberformatunitoptions
    const style = (values.style = option(
      opts,
      'style',
      ['decimal', 'percent', 'currency', 'unit'],
      'decimal'
    ))
    let currency = option(opts, 'currency', undefined, undefined)
    // ECMA-402 §6.3.1 requires exactly three ASCII letters.
    // https://tc39.es/ecma402/#sec-iswellformedcurrencycode
    if (currency !== undefined) {
      if (currency.length !== 3) throw new BadOption('Invalid currency')
      for (let index = 0; index < 3; index++) {
        const code = apply(charCodeAt, currency, [index]) as number
        if (!((code >= 65 && code <= 90) || (code >= 97 && code <= 122)))
          throw new BadOption('Invalid currency')
      }
      currency = apply(upper, currency, []) as string
      values.currency = currency
    }
    if (style === 'currency' && currency === undefined)
      throw new BadReceiver('currency must be defined')
    values.currencyDisplay = option(
      opts,
      'currencyDisplay',
      ['code', 'symbol', 'narrowSymbol', 'name'],
      'symbol'
    )
    values.currencySign = option(
      opts,
      'currencySign',
      ['standard', 'accounting'],
      'standard'
    )
    const unit = (values.unit = option(opts, 'unit', undefined, undefined))
    if (unit !== undefined && !validUnit(unit))
      throw new BadOption('Invalid unit')
    if (style === 'unit' && unit === undefined)
      throw new BadReceiver('unit must be defined')
    values.unitDisplay = option(
      opts,
      'unitDisplay',
      ['short', 'narrow', 'long'],
      'short'
    )
    const notation = (values.notation = option(
      opts,
      'notation',
      ['standard', 'scientific', 'engineering', 'compact'],
      'standard'
    ))
    // ECMA-402 §16.1.2 reads precision values, then coerces active branches.
    // https://tc39.es/ecma402/#sec-setnumberformatdigitoptions
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
      ['auto', 'stripIfInteger', 'stripToMinimum'],
      'auto'
    )
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
      values.maximumSignificantDigits = number(maxSignificant, minimum, 21, 21)
    }
    if (needFraction) {
      values.minimumFractionDigits = number(minFraction, 0, 100, undefined)
      values.maximumFractionDigits = number(maxFraction, 0, 100, undefined)
    }
    // Resolve precision/defaults and reject increment conflicts before the next Get.
    configured(seed, values)
    values.compactDisplay = option(
      opts,
      'compactDisplay',
      ['short', 'long'],
      'short'
    )
    // ECMA-402 §9.2.12 tests booleans before coercing legacy strings.
    // https://tc39.es/ecma402/#sec-getbooleanorstringnumberformatoption
    const grouping = opts.useGrouping
    const defaultGrouping = notation === 'compact' ? 'min2' : 'auto'
    if (grouping === undefined) values.useGrouping = defaultGrouping
    else if (!grouping) values.useGrouping = false
    else if (grouping === true) values.useGrouping = true
    else {
      const text = `${grouping}`
      if (text === 'true' || text === 'false')
        values.useGrouping = defaultGrouping
      else if (text === 'auto' || text === 'always' || text === 'min2')
        values.useGrouping = text
      else throw new BadOption('Invalid useGrouping')
    }
    values.signDisplay = option(
      opts,
      'signDisplay',
      ['auto', 'never', 'always', 'exceptZero', 'negative'],
      'auto'
    )
    // ECMA-402 §16.4: the handle owns resolved state and the wrapper caches [[BoundFormat]].
    // https://tc39.es/ecma402/#sec-properties-of-intl-numberformat-instances
    const value = create(null) as State
    value.handle = configured(seed, values)
    value.bound = undefined
    apply(setSlot, slots, [receiver, value])
    return receiver
  }
  // ECMA-402 §16.2 Constructor inherits Function.prototype.
  // https://tc39.es/ecma402/#sec-properties-of-intl-numberformat-constructor
  let NumberFormat: any = function (
    this: any,
    locales: unknown = undefined,
    optionsInput: unknown = undefined
  ): object {
    const receiver = initialize(locales, optionsInput, NumberFormat)
    // https://tc39.es/ecma402/#sec-chainnumberformat
    if (isObject(this) && apply(isPrototypeOf, prototype, [this])) {
      const descriptor = create(null)
      descriptor.value = receiver
      descriptor.writable = false
      descriptor.enumerable = false
      descriptor.configurable = false
      define(this, fallbackSymbol, descriptor)
      return this
    }
    return receiver
  }
  // ECMA-402 §16.3 Ordinary prototype inherits Object.prototype and has no instance slots.
  // https://tc39.es/ecma402/#sec-properties-of-intl-numberformat-prototype-object
  const prototype = NumberFormat.prototype
  NumberFormat = new ProxyConstructor(NumberFormat, {
    // The private proxy handler has no inherited traps.
    // https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
    __proto__: null,
    construct(_target, args, newTarget): object {
      return initialize(
        args.length > 0 ? args[0] : undefined,
        args.length > 1 ? args[1] : undefined,
        newTarget
      )
    },
  } as ProxyHandler<Function>)
  function unwrap(receiver: any): State {
    // https://tc39.es/ecma402/#sec-unwrapnumberformat
    if (!isObject(receiver)) throw new BadReceiver('Expected an object')
    const value = apply(getSlot, slots, [receiver]) as State | undefined
    if (value) return value
    if (apply(isPrototypeOf, prototype, [receiver])) {
      return state(receiver[fallbackSymbol])
    }
    return state(receiver)
  }
  // ECMA-402 §16.3.1 links the prototype to the installed constructor.
  // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.constructor
  property(prototype, 'constructor', NumberFormat)
  property(NumberFormat, 'name', 'NumberFormat', false, false)
  function numeric(value: {
    text: string
    bigint: boolean
    string: boolean
  }): string {
    return (
      '{"text":' +
      quote(value.text) +
      ',"bigint":' +
      value.bigint +
      ',"string":' +
      value.string +
      '}'
    )
  }
  function formatNumber(handle: object, input: unknown): string {
    return decoded(
      nativeQuery(
        handle,
        '{"method":"format","value":' + numeric(mathematical(input)) + '}'
      )
    )
  }
  function range(
    receiver: unknown,
    start: unknown,
    end: unknown,
    method: string
  ): any {
    // ECMA-402 §§16.3.4–5 steps 3–5 coerce both endpoints before checking NaN.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrange
    const handle = state(receiver).handle
    if (start === undefined || end === undefined)
      throw new BadReceiver('Range endpoints must be defined')
    const first = mathematical(start),
      last = mathematical(end)
    return decoded(
      nativeQuery(
        handle,
        '{"method":' +
          quote(method) +
          ',"start":' +
          numeric(first) +
          ',"end":' +
          numeric(last) +
          '}'
      )
    )
  }
  const methods = {
    // ECMA-402 §16.2.2 canonicalizes locales before reading the matcher.
    // https://tc39.es/ecma402/#sec-intl.numberformat.supportedlocalesof
    supportedLocalesOf(
      locales: unknown,
      optionsInput: unknown = undefined
    ): string[] {
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
    // ECMA-402 §16.3.6 checks the receiver before coercion.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formattoparts
    formatToParts(this: unknown, value: unknown): object[] {
      const handle = state(this).handle
      return decoded(
        nativeQuery(
          handle,
          '{"method":"formatToParts","value":' +
            numeric(mathematical(value)) +
            '}'
        )
      )
    },
    // ECMA-402 §16.3.4 delegates receiver validation and endpoint coercion.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrange
    formatRange(this: unknown, start: unknown, end: unknown): string {
      return range(this, start, end, 'formatRange')
    },
    // ECMA-402 §16.3.5 uses the same checks and returns source-tagged parts.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrangetoparts
    formatRangeToParts(this: unknown, start: unknown, end: unknown): object[] {
      return range(this, start, end, 'formatRangeToParts')
    },
    // ECMA-402 §16.3.2 defines active slots in table order on a fresh object.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.resolvedoptions
    resolvedOptions(this: unknown): object {
      const values = decoded(
        nativeQuery(unwrap(this).handle, '{"method":"resolvedOptions"}')
      )
      const result = create(objectPrototype)
      const names = [
        'locale',
        'numberingSystem',
        'style',
        'currency',
        'currencyDisplay',
        'currencySign',
        'unit',
        'unitDisplay',
        'minimumIntegerDigits',
        'minimumFractionDigits',
        'maximumFractionDigits',
        'minimumSignificantDigits',
        'maximumSignificantDigits',
        'useGrouping',
        'notation',
        'compactDisplay',
        'signDisplay',
        'roundingIncrement',
        'roundingMode',
        'roundingPriority',
        'trailingZeroDisplay',
      ]
      for (let index = 0; index < names.length; index++) {
        const name = names[index]
        if (apply(own, values, [name]))
          property(result, name, values[name], true)
      }
      return result
    },
    // ECMA-402 §16.3.3 validates the receiver and caches the bound formatter.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.format
    getFormat(this: unknown): (value: unknown) => string {
      const value = unwrap(this)
      if (value.bound === undefined) {
        const format = (input: unknown): string =>
          formatNumber(value.handle, input)
        property(format, 'name', '', false, false)
        value.bound = format
      }
      return value.bound
    },
    __addLocaleData(...packs: unknown[]): void {
      for (let index = 0; index < packs.length; index++) {
        const pack = packs[index]
        if (typeof pack !== 'string')
          throw new BadReceiver('Expected number locale JSON string')
        const status = nativeLoad(pack)
        if (status !== 0) decoded(status)
      }
    },
    __addUnitData(locale: unknown, data: unknown): void {
      if (typeof locale !== 'string' || typeof data !== 'string')
        throw new BadReceiver('Expected locale and unit JSON strings')
      const status = nativeUnits(
        '{"locale":' + quote(locale) + ',"data":' + data + '}'
      )
      if (status !== 0) decoded(status)
    },
    getDefaultLocale(): string {
      return decoded(nativeInfo()).default || ''
    },
    getAvailableLocales(): Set<string> {
      const values = decoded(nativeInfo()).available
      const result = new SetConstructor<string>()
      for (let index = 0; index < values.length; index++)
        apply(setAdd, result, [values[index]])
      return result
    },
  }
  property(methods.getFormat, 'name', 'get format', false, false)
  const descriptor = create(null)
  descriptor.get = methods.getFormat
  descriptor.enumerable = false
  descriptor.configurable = true
  define(prototype, 'format', descriptor)
  const prototypeMethods = [
    'formatToParts',
    'formatRange',
    'formatRangeToParts',
    'resolvedOptions',
  ] as const
  for (let index = 0; index < prototypeMethods.length; index++) {
    const name = prototypeMethods[index]
    property(prototype, name, methods[name])
  }
  const constructorMethods = [
    'supportedLocalesOf',
    '__addLocaleData',
    '__addUnitData',
    'getDefaultLocale',
  ] as const
  for (let index = 0; index < constructorMethods.length; index++) {
    const name = constructorMethods[index]
    property(NumberFormat, name, methods[name])
  }
  const available = create(null)
  available.get = methods.getAvailableLocales
  available.configurable = true
  define(NumberFormat, 'availableLocales', available)
  // ECMA-402 §16.3.7 https://tc39.es/ecma402/#sec-intl.numberformat.prototype-%symbol.tostringtag%
  property(prototype, Symbol.toStringTag, 'Intl.NumberFormat', false, false)
  property(NumberFormat, 'polyfilled', true)
  // ECMA-402 §16.2.1 fixes the constructor's prototype property.
  // https://tc39.es/ecma402/#sec-intl.numberformat.prototype
  const prototypeDescriptor = create(null)
  prototypeDescriptor.writable = false
  define(NumberFormat, 'prototype', prototypeDescriptor)
  // ECMA-402 §8.2.7 exposes %Intl.NumberFormat% on Intl.
  // https://tc39.es/ecma402/#sec-intl.numberformat-intro
  property(intl, 'NumberFormat', NumberFormat)
  const numberMethods = {
    // ECMA-402 §20.2.1 steps 1–3 validate the receiver, then call FormatNumeric.
    // https://tc39.es/ecma402/#sup-number.prototype.tolocalestring
    toLocaleString(this: unknown) {
      const value = apply(numberValueOf, this, [])
      const formatter = new NumberFormat(arguments[0], arguments[1])
      return formatNumber(state(formatter).handle, value)
    },
  }
  const bigIntMethods = {
    // ECMA-402 §20.3.1 steps 1–3 format the BigInt mathematical value exactly.
    // https://tc39.es/ecma402/#sup-bigint.prototype.tolocalestring
    toLocaleString(this: unknown) {
      const value = apply(bigIntValueOf!, this, [])
      const formatter = new NumberFormat(arguments[0], arguments[1])
      return formatNumber(state(formatter).handle, value)
    },
  }
  property(Number.prototype, 'toLocaleString', numberMethods.toLocaleString)
  if (bigIntPrototype) {
    property(bigIntPrototype, 'toLocaleString', bigIntMethods.toLocaleString)
  }
})
