// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeLoad: (kind: number, pack: string) => number
  nativeInfo: () => string | number
  nativeDefaultZone: (zone: string) => number
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
    nativeLoad,
    nativeInfo,
    nativeDefaultZone,
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
    hasInstance = Function.prototype[Symbol.hasInstance],
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
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver(
      'Install Intl.getCanonicalLocales before DateTimeFormat'
    )
  type Slot = {
    handle: object
    callbacks: object
    bound?: (value?: unknown) => string
  }
  const slots = new WeakMap<object, Slot>()
  const callbacks = create(null)
  const temporal = root.Temporal
  const readers: {kind: string; read: Function}[] = []
  const kinds = [
    'PlainDate',
    'PlainYearMonth',
    'PlainMonthDay',
    'PlainTime',
    'PlainDateTime',
    'Instant',
    'ZonedDateTime',
  ]
  if (temporal) {
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
  }
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
  function options(value: unknown): any {
    if (value === undefined) return create(null)
    if (value === null) throw new BadReceiver('Options cannot be null')
    return object(value)
  }
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
  function slot(receiver: unknown): Slot {
    const value = apply(getSlot, slots, [receiver]) as Slot | undefined
    if (!value)
      throw new BadReceiver('Incompatible Intl.DateTimeFormat receiver')
    return value
  }
  function value(input: unknown, allowNow: boolean): string {
    if (input === undefined && allowNow) input = apply(dateNow, Date, [])
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
    const state = slot(receiver)
    if (first === undefined || second === undefined)
      throw new BadReceiver('startDate/endDate cannot be undefined')
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
  const lateNames = ['formatMatcher', 'dateStyle', 'timeStyle']
  const styles = ['full', 'long', 'medium', 'short']
  function DateTimeFormat(
    this: any,
    locales?: unknown,
    optionsInput?: unknown
  ): any {
    if (!new.target && !apply(hasInstance, DateTimeFormat, [this]))
      return new (DateTimeFormat as any)(locales, optionsInput)
    const construction = handle(nativeBegin())
    try {
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
      const zone = opts.timeZone
      checked(
        nativeZone(
          construction,
          zone === undefined ? 'null' : quote(string(zone))
        )
      )
      for (let index = 0; index < componentNames.length; index++) {
        const key = componentNames[index]
        if (key === 'fractionalSecondDigits') {
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
      late.formatMatcher = option(
        opts,
        'formatMatcher',
        ['basic', 'best fit'],
        'best fit'
      )
      late.dateStyle = option(opts, 'dateStyle', styles)
      late.timeStyle = option(opts, 'timeStyle', styles)
      const model = handle(nativeCreate(construction, record(late, lateNames)))
      const previous = apply(getSlot, slots, [this]) as Slot | undefined
      if (previous) previous.handle = model
      else apply(setSlot, slots, [this, {handle: model, callbacks}])
      return this
    } finally {
      nativeReleaseConstruction(construction)
    }
  }
  const prototype = DateTimeFormat.prototype
  const methods = {
    resolvedOptions(this: unknown): object {
      return decoded(nativeQuery(slot(this).handle, '{"op":"resolved"}'))
    },
    formatToParts(this: unknown, input?: unknown): object[] {
      return single(slot(this), input, 'parts')
    },
    formatRange(this: unknown, first: unknown, second: unknown): string {
      return range(this, first, second, 'range')
    },
    formatRangeToParts(
      this: unknown,
      first: unknown,
      second: unknown
    ): object[] {
      return range(this, first, second, 'rangeParts')
    },
    get format(): (input?: unknown) => string {
      const state = slot(this)
      if (!state.bound) {
        const bound = (input?: unknown): string =>
          single(state, input, 'format')
        property(bound, 'name', '', false)
        state.bound = bound
      }
      return state.bound
    },
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
  const format = create(null)
  format.get = descriptor(methods, 'format')!.get
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
  property(DateTimeFormat, 'calendarData', create(null))
  property(DateTimeFormat, 'polyfilled', true)
  property(DateTimeFormat, 'relevantExtensionKeys', ['nu', 'ca', 'hc'])
  property(DateTimeFormat, 'length', 0, false)
  property(prototype, Symbol.toStringTag, 'Intl.DateTimeFormat', false)
  const attributes = create(null)
  attributes.writable = false
  define(DateTimeFormat, 'prototype', attributes)
  property(intl, 'DateTimeFormat', DateTimeFormat)
})
