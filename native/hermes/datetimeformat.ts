// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  fallbackSymbol: symbol
  nativeLoad: (kind: number, pack: string) => number
  nativeInfo: () => string | number
  nativeCalendars: () => string | number
  nativeDefaultZone: (zone: string) => number
  nativeHasZone: (zone: string) => boolean | number
  nativeLoadCalendar: (pack: string) => number
  nativeCalendar: (
    name: string,
    callback: (milliseconds: number) => string
  ) => number
  nativeSupported: (request: string) => string | number
  nativeBegin: () => object | number
  nativeResolve: (handle: object, request: string) => number
  nativeZone: (handle: object, request: string) => number
  nativeCapture: (handle: object, request: string) => number
  nativeCreate: (handle: object, request: string) => object | number
  nativeReleaseConstruction: (handle: object) => void
  nativeQuery: (handle: object, request: string) => string | number
}) {
  'use strict'
  const {
    fallbackSymbol,
    nativeLoad,
    nativeInfo,
    nativeCalendars,
    nativeDefaultZone,
    nativeHasZone,
    nativeLoadCalendar,
    nativeCalendar,
    nativeSupported,
    nativeBegin,
    nativeResolve,
    nativeZone,
    nativeCapture,
    nativeCreate,
    nativeReleaseConstruction,
    nativeQuery,
  } = native
  const apply = Reflect.apply,
    create = Object.create,
    define = Object.defineProperty,
    descriptor = Object.getOwnPropertyDescriptor,
    assign = Object.assign,
    object = Object,
    string = String,
    floor = Math.floor,
    parse = JSON.parse,
    stringify = JSON.stringify,
    charCodeAt = String.prototype.charCodeAt,
    isPrototypeOf = Object.prototype.isPrototypeOf,
    getSlot = WeakMap.prototype.get,
    setSlot = WeakMap.prototype.set,
    setAdd = Set.prototype.add,
    SetConstructor = Set,
    BadReceiver = TypeError,
    BadOption = RangeError,
    dateGetTime = Date.prototype.getTime,
    dateNow = Date.now
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const hostTimeZoneProvider = (() => {
    try {
      const Constructor = intl.DateTimeFormat
      if (typeof Constructor !== 'function' || Constructor.polyfilled) return
      const resolvedOptions = Constructor.prototype?.resolvedOptions
      if (typeof resolvedOptions === 'function')
        return {Constructor, resolvedOptions}
    } catch {
      // A partial host Intl can fail before the time-zone query.
    }
  })()
  let lastHostZone: string | undefined
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver(
      'Install Intl.getCanonicalLocales before DateTimeFormat'
    )
  // ECMA-402 §11.4: the handle owns formatter state and the wrapper holds [[BoundFormat]].
  // https://tc39.es/ecma402/#sec-properties-of-intl-datetimeformat-instances
  type Slot = {
    handle: object
    callbacks: object
    bound: ((value?: unknown) => string) | undefined
  }
  const slots = new WeakMap<object, Slot>()
  const callbacks = create(null)
  const readers: {kind: string; read: Function}[] = []
  const namespaces = new WeakSet<object>()
  const hasNamespace = WeakSet.prototype.has,
    addNamespace = WeakSet.prototype.add
  const kinds = [
    'PlainDate',
    'PlainYearMonth',
    'PlainMonthDay',
    'PlainTime',
    'PlainDateTime',
    'Instant',
    'ZonedDateTime',
  ]
  function addTemporalNamespace(temporal: any): void {
    if (
      temporal === null ||
      (typeof temporal !== 'object' && typeof temporal !== 'function') ||
      apply(hasNamespace, namespaces, [temporal])
    )
      return
    for (let index = 0; index < kinds.length; index++) {
      const kind = kinds[index]
      const prototype = temporal[kind]?.prototype
      if (!prototype) continue
      const reader = descriptor(
        prototype,
        kind === 'Instant' || kind === 'ZonedDateTime'
          ? 'epochNanoseconds'
          : 'toString'
      )
      const read =
        kind === 'Instant' || kind === 'ZonedDateTime'
          ? reader?.get
          : reader?.value
      if (typeof read === 'function') readers[readers.length] = {kind, read}
    }
    apply(addNamespace, namespaces, [temporal])
  }
  addTemporalNamespace(root.Temporal)
  const plainOptions = create(null)
  plainOptions.calendarName = 'always'
  function property(
    target: object,
    key: PropertyKey,
    value: unknown,
    writable = true,
    enumerable = false
  ): void {
    const attributes = create(null)
    attributes.value = value
    attributes.writable = writable
    attributes.configurable = true
    attributes.enumerable = enumerable
    define(target, key, attributes)
  }
  function checked(status: number): void {
    if (status === 4)
      throw new BadReceiver('Invalid Intl.DateTimeFormat value or options')
    if (status !== 0)
      throw new BadOption('Invalid Intl.DateTimeFormat value, options or data')
  }
  function decoded(value: string | number): any {
    if (typeof value === 'number') checked(value)
    return parse(value as string)
  }
  function handle(value: object | number): object {
    if (typeof value === 'number') {
      checked(value)
      throw new BadReceiver('Missing native formatter')
    }
    return value
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
  function record(value: any, keys: readonly string[]): string {
    let result = '{',
      separator = ''
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index],
        item = value[key]
      if (item === undefined) continue
      result +=
        separator +
        quote(key) +
        ':' +
        (typeof item === 'string' ? quote(item) : `${item}`)
      separator = ','
    }
    return result + '}'
  }
  // ECMA-402 §9.2.10 defaults undefined to an empty null-prototype object.
  // https://tc39.es/ecma402/#sec-coerceoptionstoobject
  function options(value: unknown): any {
    if (value === undefined) return create(null)
    if (value === null) throw new BadReceiver('Options cannot be null')
    return object(value)
  }
  // ECMA-402 §20.4.1–3.
  // https://tc39.es/ecma402/#sup-properties-of-the-date-prototype-object
  function localDate(
    receiver: unknown,
    locales: unknown,
    optionsInput: unknown,
    mode: 'all' | 'date' | 'time'
  ): string {
    const milliseconds = apply(dateGetTime, receiver, []) as number
    if (milliseconds !== milliseconds) return 'Invalid Date'
    const formatter = initialize(
      create(prototype),
      locales,
      optionsInput,
      undefined,
      mode
    )
    return single(slot(formatter), milliseconds, 'format')
  }
  // ECMA-402 §9.2.11 uses GetOption for string fields and their defaults.
  // https://tc39.es/ecma402/#sec-getoption
  function option(
    value: any,
    key: string,
    choices?: readonly string[],
    fallback?: string
  ): string | undefined {
    const item = value[key]
    if (item === undefined) return fallback
    const text = `${item}`
    if (choices === undefined) return text
    for (let index = 0; index < choices.length; index++)
      if (choices[index] === text) return text
    throw new BadOption('Invalid Intl.DateTimeFormat option: ' + key)
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
  // The constructor's prototype is fixed. Walk the receiver's prototype chain
  // without consulting Symbol.hasInstance.
  // https://tc39.es/ecma262/#sec-ordinaryhasinstance
  function hasDateTimeFormatPrototype(receiver: unknown): boolean {
    return apply(isPrototypeOf, prototype, [receiver])
  }
  // ECMA-402 §11.5.13 unwraps only format and resolvedOptions.
  // https://tc39.es/ecma402/#sec-unwrapdatetimeformat
  function unwrap(receiver: unknown): Slot {
    const state = apply(getSlot, slots, [receiver]) as Slot | undefined
    if (state) return state
    if (hasDateTimeFormatPrototype(receiver)) {
      return slot((receiver as Record<symbol, unknown>)[fallbackSymbol])
    }
    return slot(receiver)
  }
  // ECMA-402 §11.1.2 step 18 reads the host's zone for omitted options.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  function updateHostTimeZone(): void {
    if (!hostTimeZoneProvider) return
    const {Constructor, resolvedOptions} = hostTimeZoneProvider
    let zone: string | undefined
    try {
      const resolved = apply(resolvedOptions, new Constructor(), [])
      // ECMA-402 §11.3.2 step 5 creates an own data property for the zone.
      // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.resolvedoptions
      const field = descriptor(resolved, 'timeZone')
      const value = field && descriptor(field, 'value')?.value
      if (typeof value === 'string') zone = value
    } catch {
      // A partial host Intl may not supply a timezone.
    }
    if (zone === lastHostZone) return
    checked(nativeDefaultZone('{"hostTimeZone":' + quote(zone ?? '') + '}'))
    lastHostZone = zone
  }
  function slot(receiver: unknown): Slot {
    const value = apply(getSlot, slots, [receiver]) as Slot | undefined
    if (!value)
      throw new BadReceiver('Incompatible Intl.DateTimeFormat receiver')
    return value
  }
  function value(input: unknown, allowNow: boolean): string {
    // ECMA-402 §11.3.3 step 4.a.i and §11.3.6 step 3.a call %Date.now%.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
    // https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatToParts
    if (input === undefined && allowNow) input = dateNow()
    if (input !== null && typeof input === 'object' && readers.length) {
      let isDate = false
      try {
        apply(dateGetTime, input, [])
        isDate = true
      } catch {
        /* Intrinsic brand check. */
      }
      if (!isDate) {
        for (let index = 0; index < readers.length; index++) {
          const {kind, read} = readers[index]
          let result: unknown
          try {
            result = apply(read, input, [plainOptions])
          } catch {
            continue
          }
          if (kind === 'ZonedDateTime') return '{"type":"zoned"}'
          if (kind === 'Instant')
            return (
              '{"type":"epoch","kind":"Instant","value":' +
              quote(`${result}`) +
              '}'
            )
          return (
            '{"type":"plain","kind":' +
            quote(kind) +
            ',"iso":' +
            quote(`${result}`) +
            '}'
          )
        }
      }
    }
    const number = +(input as any)
    return (
      '{"type":"number","value":' +
      quote(number === 0 && 1 / number === -Infinity ? '-0' : `${number}`) +
      '}'
    )
  }
  function single(state: Slot, input: unknown, operation: string): any {
    const request =
      '{"op":' + quote(operation) + ',"value":' + value(input, true) + '}'
    return decoded(nativeQuery(state.handle, request))
  }
  function range(
    receiver: unknown,
    first: unknown,
    second: unknown,
    operation: string
  ): any {
    // ECMA-402 §§11.3.4–5 steps 2–5 check both arguments before coercion.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.formatRange
    // https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatRangeToParts
    const state = slot(receiver)
    if (first === undefined || second === undefined)
      throw new BadReceiver('startDate/endDate cannot be undefined')
    // Both coercions finish before Rust applies TimeClip in §11.5.8 steps 1–4.
    // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
    const firstValue = value(first, false),
      secondValue = value(second, false)
    return decoded(
      nativeQuery(
        state.handle,
        '{"op":' +
          quote(operation) +
          ',"first":' +
          firstValue +
          ',"second":' +
          secondValue +
          '}'
      )
    )
  }
  const textWidths = ['narrow', 'short', 'long']
  const numericWidths = ['2-digit', 'numeric']
  // ECMA-402 §11.1.2 step 25 reads components in Table 16 order.
  // https://tc39.es/ecma402/#table-datetimeformat-components
  const componentNames = [
    'weekday',
    'era',
    'year',
    'month',
    'day',
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'fractionalSecondDigits',
    'timeZoneName',
  ]
  const earlyNames = [
    'localeMatcher',
    'calendar',
    'numberingSystem',
    'hour12',
    'hourCycle',
  ]
  const createNames = [
    'formatMatcher',
    'dateStyle',
    'timeStyle',
    'zonedLocale',
    'dateLocale',
  ]
  const styles = ['full', 'long', 'medium', 'short']
  // ECMA-402 §11.1.1 dispatches calls and construction to CreateDateTimeFormat.
  // https://tc39.es/ecma402/#sec-intl.datetimeformat
  const DateTimeFormat = new Proxy(function DateTimeFormat() {}, {
    // The private proxy handler has no inherited traps.
    // https://tc39.es/ecma262/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
    __proto__: null,
    apply(_target, receiver, args) {
      const formatter = initialize(create(prototype), args[0], args[1])
      // ECMA-402 §11.1.1.1 wraps the receiver after creating the formatter.
      // https://tc39.es/ecma402/#sec-chaindatetimeformat
      if (hasDateTimeFormatPrototype(receiver)) {
        const descriptor = create(null)
        descriptor.value = formatter
        descriptor.writable = false
        descriptor.enumerable = false
        descriptor.configurable = false
        define(receiver, fallbackSymbol, descriptor)
        return receiver
      }
      return formatter
    },
    construct(_target, args, newTarget) {
      // ECMA-402 §11.1.2 step 1 uses NewTarget.prototype before reading options.
      // https://tc39.es/ecma402/#sec-createdatetimeformat
      // ECMA-262 §10.1.14 step 4 uses the constructor's realm. Here the
      // intrinsic fallback is limited to the polyfill's own realm.
      // https://tc39.es/ecma262/#sec-getprototypefromconstructor
      const requested = newTarget.prototype
      const receiver = create(
        requested !== null &&
          (typeof requested === 'object' || typeof requested === 'function')
          ? requested
          : prototype
      )
      return initialize(receiver, args[0], args[1])
    },
  } as ProxyHandler<Function>)
  type TemporalValue = {
    kind: string
    calendar?: string
    epochNanoseconds: bigint
    timeZone?: string
  }
  // ECMA-402 §11.1.2 creates the formatter in phases across the Rust bridge.
  // https://tc39.es/ecma402/#sec-createdatetimeformat
  function initialize(
    receiver: any,
    locales: unknown,
    optionsInput: unknown,
    temporal?: TemporalValue,
    dateLocale?: 'all' | 'date' | 'time'
  ): any {
    const construction = handle(nativeBegin())
    try {
      // ECMA-402 §9.2.8 steps 1–6 read locales before options and descriptors.
      // https://tc39.es/ecma402/#sec-resolveoptions
      const requested = tags(apply(canonicalize, intl, [locales]) as string[])
      const opts = options(optionsInput),
        early = create(null),
        components = create(null),
        late = create(null)
      early.localeMatcher = option(
        opts,
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      early.calendar = option(opts, 'calendar')
      if (early.calendar !== undefined && !unicodeType(early.calendar))
        throw new BadOption('Malformed calendar')
      early.numberingSystem = option(opts, 'numberingSystem')
      if (
        early.numberingSystem !== undefined &&
        !unicodeType(early.numberingSystem)
      )
        throw new BadOption('Malformed numbering system')
      const hour12 = opts.hour12
      if (hour12 !== undefined) early.hour12 = !!hour12
      early.hourCycle = option(opts, 'hourCycle', ['h11', 'h12', 'h23', 'h24'])
      // ECMA-402 §11.1.2 steps 2–14 retain locale data before reading timeZone.
      // https://tc39.es/ecma402/#sec-createdatetimeformat
      checked(
        nativeResolve(
          construction,
          '{"locales":' +
            requested +
            ',"options":' +
            record(early, earlyNames) +
            '}'
        )
      )
      let zone = opts.timeZone
      if (temporal?.kind === 'ZonedDateTime') {
        if (zone !== undefined)
          throw new BadReceiver('timeZone option conflicts with ZonedDateTime')
        zone = temporal.timeZone
      }
      // The Temporal integration reads timeZone before looking up the host default.
      // https://github.com/tc39/ecma402/pull/1044
      if (zone === undefined) updateHostTimeZone()
      // ECMA-402 §11.1.2 step 18 uses GetOption, which throws for Symbols.
      // https://tc39.es/ecma402/#sec-createdatetimeformat
      // https://tc39.es/ecma402/#sec-getoption
      checked(
        nativeZone(construction, zone === undefined ? 'null' : quote(`${zone}`))
      )
      for (let index = 0; index < componentNames.length; index++) {
        const key = componentNames[index]
        if (key === 'fractionalSecondDigits') {
          // ECMA-402 §9.2.13 steps 2–4 check bounds before truncation.
          // https://tc39.es/ecma402/#sec-defaultnumberoption
          const raw = opts[key]
          if (raw !== undefined) {
            const digits = +(raw as any)
            if (!(digits >= 1 && digits <= 3))
              throw new BadOption('Invalid fractionalSecondDigits')
            components[key] = floor(digits)
          }
        } else {
          const choices =
            key === 'month'
              ? ['2-digit', 'numeric', 'narrow', 'short', 'long']
              : key === 'timeZoneName'
                ? [
                    'long',
                    'short',
                    'longOffset',
                    'shortOffset',
                    'longGeneric',
                    'shortGeneric',
                  ]
                : key === 'weekday' || key === 'era' || key === 'dayPeriod'
                  ? textWidths
                  : numericWidths
          components[key] = option(opts, key, choices)
        }
      }
      checked(nativeCapture(construction, record(components, componentNames)))
      // ECMA-402 §11.1.2 steps 26–30 read the matcher, then both styles.
      // https://tc39.es/ecma402/#sec-createdatetimeformat
      late.formatMatcher = option(
        opts,
        'formatMatcher',
        ['basic', 'best fit'],
        'best fit'
      )
      late.dateStyle = option(opts, 'dateStyle', styles)
      late.timeStyle = option(opts, 'timeStyle', styles)
      // ECMA-402 §11.1.2 steps 31.b–c reject styles outside the required fields.
      // https://tc39.es/ecma402/#sec-createdatetimeformat
      if (dateLocale === 'date' && late.timeStyle !== undefined)
        throw new BadReceiver('timeStyle is not valid for toLocaleDateString')
      if (dateLocale === 'time' && late.dateStyle !== undefined)
        throw new BadReceiver('dateStyle is not valid for toLocaleTimeString')
      late.dateLocale = dateLocale
      if (temporal) {
        if (temporal.kind === 'PlainTime' && late.dateStyle !== undefined)
          throw new BadReceiver('dateStyle is not valid for PlainTime')
        if (
          (temporal.kind === 'PlainDate' ||
            temporal.kind === 'PlainYearMonth' ||
            temporal.kind === 'PlainMonthDay') &&
          late.timeStyle !== undefined
        )
          throw new BadReceiver('timeStyle is not valid for plain dates')
        if (temporal.kind === 'ZonedDateTime') late.zonedLocale = true
      }
      const model = handle(
        nativeCreate(construction, record(late, createNames))
      )
      // ECMA-402 §11.1.2 steps 33–35 finish the private state and return.
      // https://tc39.es/ecma402/#sec-createdatetimeformat
      const state: Slot = {handle: model, callbacks, bound: undefined}
      apply(setSlot, slots, [receiver, state])
      return receiver
    } finally {
      nativeReleaseConstruction(construction)
    }
  }
  function formatTemporal(
    value: TemporalValue,
    locales: unknown,
    optionsInput: unknown
  ): string {
    const formatter = initialize(
      create(prototype),
      locales,
      optionsInput,
      value
    )
    const input = create(null)
    input.type = 'epoch'
    input.kind = value.kind === 'ZonedDateTime' ? 'Instant' : value.kind
    input.value = `${value.epochNanoseconds}`
    input.calendar = value.calendar
    return decoded(
      nativeQuery(
        slot(formatter).handle,
        '{"op":"format","value":' +
          record(input, ['type', 'kind', 'value', 'calendar']) +
          '}'
      )
    ) as string
  }
  const prototype = DateTimeFormat.prototype
  const methods = {
    // ECMA-402 §11.3.2.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.resolvedoptions
    resolvedOptions(this: unknown): object {
      return decoded(nativeQuery(unwrap(this).handle, '{"op":"resolved"}'))
    },
    // ECMA-402 §11.3.6.
    // https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatToParts
    formatToParts(this: unknown, input?: unknown): object[] {
      return single(slot(this), input, 'parts')
    },
    // ECMA-402 §11.3.4.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.formatRange
    formatRange(this: unknown, first: unknown, second: unknown): string {
      return range(this, first, second, 'range')
    },
    // ECMA-402 §11.3.5.
    // https://tc39.es/ecma402/#sec-Intl.DateTimeFormat.prototype.formatRangeToParts
    formatRangeToParts(
      this: unknown,
      first: unknown,
      second: unknown
    ): object[] {
      return range(this, first, second, 'rangeParts')
    },
    // ECMA-402 §11.2.2: canonicalize before reading FilterLocales options.
    // https://tc39.es/ecma402/#sec-intl.datetimeformat.supportedlocalesof
    supportedLocalesOf(locales: unknown, optionsInput?: unknown): string[] {
      const requested = tags(apply(canonicalize, intl, [locales]) as string[])
      const values = create(null)
      values.localeMatcher = option(
        options(optionsInput),
        'localeMatcher',
        ['lookup', 'best fit'],
        'best fit'
      )
      return decoded(
        nativeSupported(
          '{"locales":' +
            requested +
            ',"options":' +
            record(values, ['localeMatcher']) +
            '}'
        )
      )
    },
    __addLocaleData(...packs: unknown[]): void {
      load(0, packs)
    },
    __addCalendarLocaleData(...packs: unknown[]): void {
      load(1, packs)
    },
    __addTZData(pack: unknown): void {
      load(2, [pack])
    },
    __setDefaultTimeZone(zone?: unknown): void {
      checked(
        nativeDefaultZone(zone === undefined ? 'null' : quote(string(zone)))
      )
    },
    getDefaultTimeZone(): string {
      updateHostTimeZone()
      return decoded(nativeInfo()).timeZone
    },
    getDefaultLocale(): string {
      return decoded(nativeInfo()).default || ''
    },
    __addCalendarData(...packs: any[]): void {
      for (let index = 0; index < packs.length; index++)
        registerCalendar(packs[index])
    },
    get availableLocales(): Set<string> {
      const values = decoded(nativeInfo()).available,
        result = new SetConstructor<string>()
      for (let index = 0; index < values.length; index++)
        apply(setAdd, result, [values[index]])
      return result
    },
  }
  // Default Hermes needs a per-call scope for each retained callback.
  function registerCalendar(pack: any): void {
    if (typeof pack === 'string') {
      checked(nativeLoadCalendar(pack))
      return
    }
    const {calendar, dateFromTime} = pack
    const name = string(calendar)
    const registry = (DateTimeFormat as any).calendarData
    property(registry, name, dateFromTime, true, true)
    const wrapper = (milliseconds: number): string => {
      const current = (DateTimeFormat as any).calendarData
      const raw = assign(
        create(null),
        apply(current[name], current, [milliseconds])
      )
      const fields = create(null)
      const names = [
        'era',
        'year',
        'month',
        'day',
        'monthNameIndex',
        'monthNumber',
        'leapMonth',
        'relatedYear',
        'yearName',
      ]
      for (let index = 0; index < names.length; index++) {
        const key = names[index]
        fields[key] = raw[key]
      }
      return record(fields, names)
    }
    property(callbacks, name, wrapper)
    checked(nativeCalendar(name, wrapper))
  }
  function load(kind: number, packs: unknown[]): void {
    for (let index = 0; index < packs.length; index++) {
      const pack = packs[index]
      if (typeof pack !== 'string')
        throw new BadReceiver('Expected native DateTimeFormat JSON pack')
      checked(nativeLoad(kind, pack))
    }
  }
  const instanceNames = [
    'resolvedOptions',
    'formatToParts',
    'formatRange',
    'formatRangeToParts',
  ] as const
  for (let index = 0; index < instanceNames.length; index++)
    property(prototype, instanceNames[index], methods[instanceNames[index]])
  // ECMA-402 §11.3.3 steps 2–5 unwrap, brand-check, and cache [[BoundFormat]].
  // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
  const format = create(null)
  // Hermes makes object-literal getters constructible; the arrow target is not.
  format.get = new Proxy(() => {}, {
    __proto__: null,
    apply(_target, receiver) {
      const state = unwrap(receiver)
      if (state.bound === undefined) {
        const bound = (input?: unknown): string =>
          single(state, input, 'format')
        property(bound, 'name', '', false)
        state.bound = bound
      }
      return state.bound
    },
  } as ProxyHandler<() => void>)
  format.configurable = true
  property(format.get, 'name', 'get format', false)
  define(prototype, 'format', format)
  const staticNames = [
    'supportedLocalesOf',
    '__addLocaleData',
    '__addCalendarLocaleData',
    '__addTZData',
    '__setDefaultTimeZone',
    'getDefaultTimeZone',
    'getDefaultLocale',
    '__addCalendarData',
  ] as const
  for (let index = 0; index < staticNames.length; index++)
    property(DateTimeFormat, staticNames[index], methods[staticNames[index]])
  property(methods.supportedLocalesOf, 'length', 1, false)
  const available = create(null)
  available.get = descriptor(methods, 'availableLocales')!.get
  available.configurable = true
  define(DateTimeFormat, 'availableLocales', available)
  // ECMA-402 §6.9.1 uses calendars from every loaded locale.
  // https://tc39.es/ecma402/#sec-availablecalendars
  const calendars = create(null)
  calendars.value = (): string[] => decoded(nativeCalendars())
  define(
    DateTimeFormat,
    Symbol.for('@formatjs/intl-datetimeformat/availableCalendars'),
    calendars
  )
  // ECMA-402 §6.5.2 resolves zones independently of locale data.
  // https://tc39.es/ecma402/#sec-getavailablenamedtimezoneidentifier
  const zones = create(null)
  zones.value = (name: string): boolean => {
    const result = nativeHasZone(name)
    if (typeof result === 'boolean') return result
    checked(result)
    return false
  }
  define(
    DateTimeFormat,
    Symbol.for('@formatjs/intl-datetimeformat/hasTimeZone'),
    zones
  )
  property(DateTimeFormat, 'calendarData', create(null))
  property(DateTimeFormat, '__addTemporalNamespace', addTemporalNamespace)
  property(DateTimeFormat, '__formatTemporal', formatTemporal)
  property(DateTimeFormat, 'polyfilled', true)
  property(DateTimeFormat, 'relevantExtensionKeys', ['nu', 'ca', 'hc'])
  property(DateTimeFormat, 'length', 0, false)
  // ECMA-402 §11.3.1 exposes the public constructor on its prototype.
  // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.constructor
  property(prototype, 'constructor', DateTimeFormat)
  // ECMA-402 §11.3.7 https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype-%symbol.tostringtag%
  property(prototype, Symbol.toStringTag, 'Intl.DateTimeFormat', false)
  // ECMA-402 §11.2.1 fixes the constructor's prototype property.
  // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype
  const attributes = create(null)
  attributes.writable = false
  define(DateTimeFormat, 'prototype', attributes)
  property(intl, 'DateTimeFormat', DateTimeFormat)
  // ECMA-262 §10.3. These methods have no [[Construct]].
  // https://tc39.es/ecma262/#sec-built-in-function-objects
  const dateMethods = {
    // ECMA-402 §20.4.1 steps 5–6.
    // https://tc39.es/ecma402/#sup-date.prototype.tolocalestring
    toLocaleString(this: unknown) {
      return localDate(this, arguments[0], arguments[1], 'all')
    },
    // ECMA-402 §20.4.2 steps 5–6.
    // https://tc39.es/ecma402/#sup-date.prototype.tolocaledatestring
    toLocaleDateString(this: unknown) {
      return localDate(this, arguments[0], arguments[1], 'date')
    },
    // ECMA-402 §20.4.3 steps 5–6.
    // https://tc39.es/ecma402/#sup-date.prototype.tolocaletimestring
    toLocaleTimeString(this: unknown) {
      return localDate(this, arguments[0], arguments[1], 'time')
    },
  }
  property(Date.prototype, 'toLocaleString', dateMethods.toLocaleString)
  property(Date.prototype, 'toLocaleDateString', dateMethods.toLocaleDateString)
  property(Date.prototype, 'toLocaleTimeString', dateMethods.toLocaleTimeString)
})
