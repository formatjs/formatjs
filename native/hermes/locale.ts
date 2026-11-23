// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  canonicalTag: (tag: string) => string | null
  nativeCreate: (tag: string, options: string) => object | null
  nativeValidate: (name: string, value: string) => boolean
  nativeQuery: (handle: object, request: string) => string
  nativeTransform: (handle: object, kind: number) => object
}) {
  'use strict'
  const {
    canonicalTag,
    nativeCreate,
    nativeValidate,
    nativeQuery,
    nativeTransform,
  } = native
  const apply = Reflect.apply
  const object = Object
  const create = Object.create
  const defineProperty = Object.defineProperty
  const descriptor = Object.getOwnPropertyDescriptor
  const names = Object.getOwnPropertyNames
  const own = Object.prototype.hasOwnProperty
  const parse = JSON.parse
  const stringify = JSON.stringify
  const BadReceiver = TypeError
  const BadOption = RangeError
  // ECMA-402 §15.4: retain the canonical locale record in a private slot.
  // https://tc39.es/ecma402/#sec-properties-of-intl-locale-instances
  interface Slot {
    handle: object
    properties: Readonly<Record<string, any>> | null
  }
  const slots = new WeakMap<object, Slot>()
  const getSlot = WeakMap.prototype.get.bind(slots) as (
    key: unknown
  ) => Slot | undefined
  const setSlot = WeakMap.prototype.set.bind(slots)
  function boundedCache<K, V>() {
    const cache = new Map<K, V>()
    const get = Map.prototype.get.bind(cache) as (key: K) => V | undefined
    const set = Map.prototype.set.bind(cache)
    const clear = Map.prototype.clear.bind(cache)
    let size = 0
    return {
      get,
      set(key: K, value: V) {
        if (get(key) === undefined) {
          if (size === 64) {
            clear()
            size = 0
          }
          size++
        }
        set(key, value)
      },
    }
  }
  const constructors = boundedCache<string, Slot>()
  const transforms = boundedCache<Slot, [Slot | undefined, Slot | undefined]>()
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  const registeredLocaleTag = canonicalize?.__readLocaleTag
  const localeBrandRegistry = canonicalize?.__localeBrandRegistry
  const previousLocale = intl.Locale
  const previousToString = previousLocale?.__localeBrandRegistry
    ? undefined
    : previousLocale?.prototype?.toString
  const enumerate = intl.supportedValuesOf

  const getPrototypeOf = Object.getPrototypeOf
  const objectPrototype = Object.prototype
  type FormatterName = 'NumberFormat' | 'Collator'
  type FormatterProbe = {
    Constructor: new (...args: any[]) => object
    supportedLocalesOf: (...args: any[]) => string[]
    resolvedOptions: () => {numberingSystem?: string; collation?: string}
  }
  const currentFormatters = create(null) as Partial<
    Record<FormatterName, FormatterProbe>
  >
  const formatterProbes = new WeakMap<object, FormatterProbe>()
  const readProbe = WeakMap.prototype.get.bind(formatterProbes)
  const setProbe = WeakMap.prototype.set.bind(formatterProbes)

  function ownData(owner: object, key: string) {
    const property = descriptor(owner, key)
    return property && descriptor(property, 'value')
  }

  function formatterMethod(owner: unknown, name: string) {
    while (
      owner !== null &&
      (typeof owner === 'object' || typeof owner === 'function') &&
      owner !== objectPrototype
    ) {
      const method = ownData(owner, name)?.value
      if (typeof method === 'function') return method
      owner = getPrototypeOf(owner)
    }
  }

  // ECMA-402 §§15.5.10 and 15.5.12 read formatter slots. Retain the operations
  // for each installed provider, including replacements installed with data.
  function readFormatter(name: FormatterName): FormatterProbe | undefined {
    try {
      const data = ownData(intl, name)
      if (!data) return currentFormatters[name]
      const Constructor = data.value
      if (typeof Constructor !== 'function') return undefined
      let provider = readProbe(Constructor) as FormatterProbe | undefined
      if (!provider) {
        const supportedLocalesOf = formatterMethod(
          Constructor,
          'supportedLocalesOf'
        )
        const resolvedOptions = formatterMethod(
          ownData(Constructor, 'prototype')?.value,
          'resolvedOptions'
        )
        if (
          typeof supportedLocalesOf !== 'function' ||
          typeof resolvedOptions !== 'function'
        )
          return undefined
        provider = {
          Constructor,
          supportedLocalesOf,
          resolvedOptions,
        } as FormatterProbe
        setProbe(Constructor, provider)
      }
      currentFormatters[name] = provider
      return provider
    } catch {
      // An unavailable host formatter has no locale data to probe.
      return undefined
    }
  }

  function refreshFormatterProbes() {
    readFormatter('NumberFormat')
    readFormatter('Collator')
  }

  const lookupOptions = {__proto__: null, localeMatcher: 'lookup'}

  function slot(receiver: unknown) {
    const value = getSlot(receiver)
    if (!value) throw new BadReceiver('Incompatible Intl.Locale receiver')
    return value as Slot
  }
  function query(record: {handle: object}, request: string): any {
    return parse(nativeQuery(record.handle, request))
  }
  function properties(record: Slot): Readonly<Record<string, any>> {
    // Only immutable scalars are shared; capability queries still run per call.
    return (record.properties ??= query(record, '{"method":"properties"}'))
  }
  function readLocaleTag(value: unknown): string | undefined {
    const record = getSlot(value)
    return record === undefined ? undefined : properties(record).locale
  }
  function readOtherLocaleTag(value: object): string | undefined {
    if (typeof registeredLocaleTag === 'function') {
      const tag = registeredLocaleTag(value)
      if (tag !== undefined) return tag
    }
    if (typeof previousToString === 'function') {
      try {
        const tag = apply(previousToString, value, [])
        if (typeof tag === 'string') return tag
      } catch {
        // The host Locale intrinsic rejects an unbranded receiver.
      }
    }
    return undefined
  }
  function initialize(receiver: object, tag: string, options: string): Locale {
    const key =
      tag.length + options.length > 128
        ? undefined
        : options === '{}'
          ? '0:' + tag
          : '1:' + tag + ':' + options
    let record = key === undefined ? undefined : constructors.get(key)
    if (record === undefined) {
      const handle = nativeCreate(tag, options)
      if (handle === null)
        throw new BadOption('Invalid language tag or options')
      record = {handle, properties: null}
      if (key !== undefined) constructors.set(key, record)
    }
    setSlot(receiver, record)
    return receiver
  }
  function transform(receiver: unknown, kind: number): Locale {
    const source = slot(receiver)
    let values = transforms.get(source)
    let record = values?.[kind]
    if (record === undefined) {
      const handle = nativeTransform(source.handle, kind)
      record = {handle, properties: null}
      if (values === undefined) {
        values = [undefined, undefined]
        transforms.set(source, values)
      }
      values[kind] = record
    }
    const result = create(prototype)
    setSlot(result, record)
    return result
  }
  function quote(value: string): string {
    return stringify(value)!
  }
  function strings(values: string[]): string {
    // Serialize primitive strings only; application toJSON hooks cannot change
    // the private Rust request or observe its option record.
    let result = '['
    for (let index = 0; index < values.length; index++) {
      if (index) result += ','
      result += quote(values[index])
    }
    return result + ']'
  }

  // A derived constructor returns its own receiver, avoiding both the ordinary
  // JS constructor's Object.prototype fallback and Hermes's eager allocation
  // before Proxy construct traps. Read newTarget.prototype exactly once.
  // ECMA-402 §15.1.1, steps 1–6.
  // https://tc39.es/ecma402/#sec-Intl.Locale
  class Locale extends null {
    constructor(tag: unknown, optionsInput: unknown = undefined) {
      const requestedPrototype = new.target.prototype
      const receiver = create(
        requestedPrototype !== null &&
          (typeof requestedPrototype === 'object' ||
            typeof requestedPrototype === 'function')
          ? requestedPrototype
          : prototype
      )
      // ECMA-402 §15.1.1, steps 7–9. Genuine Locale tags bypass user coercion.
      // https://tc39.es/ecma402/#sec-Intl.Locale
      if (
        typeof tag !== 'string' &&
        (tag === null || (typeof tag !== 'object' && typeof tag !== 'function'))
      )
        throw new BadReceiver('tag must be a string or object')
      if (typeof tag !== 'string')
        tag =
          readLocaleTag(tag) ?? readOtherLocaleTag(tag as object) ?? `${tag}`
      // Steps 10–14. Options coercion precedes tag validation. Canonicalization
      // precedes every language override getter. Rust owns tag syntax/aliases.
      // https://tc39.es/ecma402/#sec-Intl.Locale
      // Without option getters, Rust can validate/canonicalize in one call.
      if (optionsInput === undefined)
        return initialize(receiver, tag as string, '{}')
      // CoerceOptionsToObject boxes non-null primitives.
      // https://tc39.es/ecma402/#sec-coerceoptionstoobject
      if (optionsInput === null) throw new BadReceiver('Options cannot be null')
      const options: any = object(optionsInput)
      const canonical = canonicalTag(tag as string)
      if (canonical === null) throw new BadOption('Invalid language tag')
      let encoded = '{'
      let separator = ''
      function option(name: string) {
        const value = options[name]
        if (value === undefined) return
        const coerced = `${value}`
        if (!nativeValidate(name, coerced))
          throw new BadOption('Invalid Intl.Locale option: ' + name)
        encoded += separator + quote(name) + ':' + quote(coerced)
        separator = ','
      }
      // UpdateLanguageId 1–9: GetOption and validation interleave. A bad earlier
      // value must throw before a later getter runs.
      // https://tc39.es/ecma402/#sec-updatelanguageid
      option('language')
      option('script')
      option('region')
      option('variants')
      // Constructor steps 16–34. String options in spec order. Numeric uses ToBoolean.
      // https://tc39.es/ecma402/#sec-Intl.Locale
      option('calendar')
      option('collation')
      option('firstDayOfWeek')
      option('hourCycle')
      option('caseFirst')
      const numeric = options.numeric
      if (numeric !== undefined) {
        encoded += separator + '"numeric":' + (numeric ? 'true' : 'false')
        separator = ','
      }
      option('numberingSystem')
      // MakeLocaleRecord at step 35. Steps 36–44 install the private JS brand
      // after Rust canonicalizes the overrides.
      // https://tc39.es/ecma402/#sec-Intl.Locale
      return initialize(receiver, canonical, encoded + '}')
    }
  }
  const target = Locale
  const prototype = Locale.prototype
  Object.setPrototypeOf(prototype, Object.prototype)

  function property(receiver: unknown, name: string): any {
    const value = properties(slot(receiver))[name]
    return value === null ? undefined : value
  }
  const members = {
    // ECMA-402 §15.3.2 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.baseName
    get baseName() {
      return property(this, 'baseName')
    },
    // ECMA-402 §15.3.8 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.language
    get language() {
      return property(this, 'language')
    },
    // ECMA-402 §15.3.14 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.script
    get script() {
      return property(this, 'script')
    },
    // ECMA-402 §15.3.13 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.region
    get region() {
      return property(this, 'region')
    },
    // ECMA-402 §15.3.23 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.variants
    get variants() {
      return property(this, 'variants')
    },
    // ECMA-402 §15.3.3 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.calendar
    get calendar() {
      return property(this, 'calendar')
    },
    // ECMA-402 §15.3.5 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.collation
    get collation() {
      return property(this, 'collation')
    },
    // ECMA-402 §15.3.6 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.firstDayOfWeek
    get firstDayOfWeek() {
      return property(this, 'firstDayOfWeek')
    },
    // ECMA-402 §15.3.7 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.hourCycle
    get hourCycle() {
      return property(this, 'hourCycle')
    },
    // ECMA-402 §15.3.4 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.caseFirst
    get caseFirst() {
      return property(this, 'caseFirst')
    },
    // ECMA-402 §15.3.12 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.numeric
    get numeric() {
      return property(this, 'numeric')
    },
    // ECMA-402 §15.3.11 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.numberingSystem
    get numberingSystem() {
      return property(this, 'numberingSystem')
    },
    // ECMA-402 §15.3.15 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.toString
    toString() {
      return properties(slot(this)).locale
    },
    // These methods create %Intl.Locale% instances, independent of a receiver's
    // constructor property, preserving variants and extensions in Rust.
    // https://tc39.es/ecma402/#sec-Intl.Locale.prototype.maximize
    maximize() {
      return transform(this, 0)
    },
    // ECMA-402 §15.3.10 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.minimize
    minimize() {
      return transform(this, 1)
    },
    // ECMA-402 §15.3.16 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getCalendars
    getCalendars() {
      const record = slot(this)
      // ECMA-402 §15.5.9 step 1 bypasses calendar availability for explicit ca.
      // https://tc39.es/ecma402/#sec-calendarsoflocale
      const available =
        properties(record).calendar === null && typeof enumerate === 'function'
          ? strings(apply(enumerate, intl, ['calendar']))
          : 'null'
      return query(
        record,
        '{"method":"calendars","available":' + available + '}'
      )
    },
    // ECMA-402 §15.3.18 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getHourCycles
    getHourCycles() {
      return query(slot(this), '{"method":"hourCycles"}')
    },
    // ECMA-402 §15.3.20 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getTimeZones
    getTimeZones() {
      const value = query(slot(this), '{"method":"timeZones"}')
      return value === null ? undefined : value
    },
    getTextInfo() {
      const value = query(slot(this), '{"method":"textInfo"}')
      // The spec requires an own direction property even when unknown.
      // https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getTextInfo
      return {
        direction: apply(own, value, ['direction'])
          ? value.direction
          : undefined,
      }
    },
    // ECMA-402 §15.3.22 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getWeekInfo
    getWeekInfo() {
      return query(slot(this), '{"method":"weekInfo"}')
    },
    // ECMA-402 §15.3.19 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getNumberingSystems
    getNumberingSystems() {
      const record = slot(this)
      const metadata = properties(record)
      let defaultSystem: string | undefined
      // NumberingSystemsOfLocale 1–5: query the actual formatter at call time.
      // Explicit nu bypasses the formatter, and unsupported locales use latn.
      // https://tc39.es/ecma402/#sec-numberingsystemsoflocale
      if (metadata.numberingSystem === null) {
        try {
          const provider = readFormatter('NumberFormat')
          if (
            provider &&
            apply(provider.supportedLocalesOf, provider.Constructor, [
              [metadata.locale],
              lookupOptions,
            ]).length
          ) {
            const format = new provider.Constructor(
              metadata.locale,
              lookupOptions
            )
            const result = apply(provider.resolvedOptions, format, [])
            const system = ownData(result, 'numberingSystem')?.value
            if (typeof system === 'string') defaultSystem = system
          }
        } catch {
          // A partial host formatter may fail even after reporting a locale match.
        }
      }
      return query(
        record,
        '{"method":"numberingSystems","defaultNumberingSystem":' +
          (defaultSystem === undefined ? 'null' : quote(defaultSystem)) +
          '}'
      )
    },
    // ECMA-402 §15.3.17 https://tc39.es/ecma402/#sec-Intl.Locale.prototype.getCollations
    getCollations() {
      const record = slot(this)
      const metadata = properties(record)
      let candidates: string[] = [],
        accepted = '['
      let matched = false,
        separator = ''
      // CollationsOfLocale 1–6: explicit co restricts; otherwise intersect global
      // candidates with this locale's actual Collator support. No capability cache.
      // https://tc39.es/ecma402/#sec-collationsoflocale
      if (metadata.collation === null) {
        try {
          const provider = readFormatter('Collator')
          matched = !!(
            provider &&
            apply(provider.supportedLocalesOf, provider.Constructor, [
              [metadata.locale],
              lookupOptions,
            ]).length
          )
          if (matched && provider) {
            candidates =
              typeof enumerate === 'function'
                ? apply(enumerate, intl, ['collation'])
                : []
            for (let index = 0; index < candidates.length; index++) {
              const collation = candidates[index]
              const formatter = new provider.Constructor(metadata.locale, {
                __proto__: null,
                collation,
                localeMatcher: 'lookup',
              })
              const result = apply(provider.resolvedOptions, formatter, [])
              if (ownData(result, 'collation')?.value === collation) {
                accepted += separator + quote(collation)
                separator = ','
              }
            }
          }
        } catch {
          matched = false
          accepted = '['
        }
      }
      return query(
        record,
        '{"method":"collations","globalCollations":' +
          strings(candidates) +
          ',"matched":' +
          (matched ? 'true' : 'false') +
          ',"accepted":' +
          accepted +
          ']}'
      )
    },
  }
  for (const name of names(members)) {
    const value = descriptor(members, name)!
    value.enumerable = false
    defineProperty(prototype, name, value)
  }
  // ECMA-402 §15.3.1 links the prototype to the installed constructor.
  // https://tc39.es/ecma402/#sec-Intl.Locale.prototype.constructor
  defineProperty(prototype, 'constructor', {
    value: Locale,
    writable: true,
    configurable: true,
  })
  // ECMA-402 §15.3.24 https://tc39.es/ecma402/#sec-intl.locale.prototype-%symbol.tostringtag%
  defineProperty(prototype, Symbol.toStringTag, {
    value: 'Intl.Locale',
    configurable: true,
  })
  // ECMA-402 §15.2.1 fixes the constructor's prototype property.
  // https://tc39.es/ecma402/#sec-Intl.Locale.prototype
  defineProperty(target, 'prototype', {writable: false})
  defineProperty(Locale, 'polyfilled', {value: true})
  if (localeBrandRegistry) {
    canonicalize.__addLocaleBrandReader(readLocaleTag)
    defineProperty(Locale, '__localeBrandRegistry', {
      value: localeBrandRegistry,
    })
  }
  defineProperty(intl, 'Locale', {
    value: Locale,
    writable: true,
    enumerable: false,
    configurable: true,
  })
  refreshFormatterProbes()
  return refreshFormatterProbes
})
