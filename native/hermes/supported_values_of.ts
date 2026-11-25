// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (
  nativeSupportedValuesOf: (
    key: string,
    constructor: unknown,
    resolvedOptions: unknown,
    formatProbe: unknown,
    makeOptions: () => object,
    availableCalendars: readonly string[] | undefined
  ) => string[] | null
) {
  'use strict'
  const defineProperty = Object.defineProperty
  const create = Object.create
  const descriptor = Object.getOwnPropertyDescriptor
  const getPrototypeOf = Object.getPrototypeOf
  const objectPrototype = Object.prototype
  const MapConstructor = Map
  const ProxyConstructor = Proxy
  const InvalidKeyError = RangeError
  const root = globalThis as unknown as {Intl?: object}
  const intl = root.Intl || (root.Intl = {})
  const apply = Reflect.apply
  const construct = Reflect.construct
  const mapGet = Map.prototype.get
  const mapSet = Map.prototype.set
  const weakGet = WeakMap.prototype.get
  const weakSet = WeakMap.prototype.set
  const availableCalendarsKey = Symbol.for(
    '@formatjs/intl-datetimeformat/availableCalendars'
  )
  const hasTimeZoneKey = Symbol.for('@formatjs/intl-datetimeformat/hasTimeZone')

  type Provider = {
    constructor: object
    resolvedOptions?: object
    currencyProbe?: (formatter: unknown, code: string) => boolean | string
    currencyName?: (formatter: unknown, code: string) => unknown
    availableCalendars?: () => readonly string[]
    hasTimeZone?: (name: string) => boolean
  }
  type LoaderState = {version: number; loaders: Map<string, unknown>}
  type Cached = {
    provider: Provider
    version: number
    names: Provider | undefined
    namesVersion: number
    values: string[]
  }
  const providers = new WeakMap<object, Provider>()
  const current = new Map<FormatterName, Provider>()
  const watched = new WeakMap<object, LoaderState>()
  const cached = new Map<string, Cached>()
  const makeOptions = (): object => create(null)

  function ownValue(owner: object, key: PropertyKey): unknown {
    const property = descriptor(owner, key)
    return property && descriptor(property, 'value')?.value
  }

  function findMethod(
    constructor: object,
    name: string
  ): PropertyDescriptor | undefined {
    let owner = ownValue(constructor, 'prototype')
    while (
      owner !== null &&
      typeof owner === 'object' &&
      owner !== objectPrototype
    ) {
      const property = descriptor(owner, name)
      if (property) return property
      owner = getPrototypeOf(owner)
    }
  }

  // ECMA-402 §8.3.2 steps 2–7 use implementation data. Capture providers
  // at installation or on first use of an explicitly installed replacement.
  // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
  function getProvider(name: FormatterName): Provider | undefined {
    const property = descriptor(intl, name)
    const data = property && descriptor(property, 'value')
    if (!data) return apply(mapGet, current, [name])
    const constructor = data.value
    if (typeof constructor !== 'function') return undefined
    let provider = apply(weakGet, providers, [constructor]) as
      | Provider
      | undefined
    if (!provider) {
      const resolved = findMethod(constructor, 'resolvedOptions')
      const resolvedOptions = resolved && ownValue(resolved, 'value')
      provider = {
        constructor,
        resolvedOptions:
          typeof resolvedOptions === 'function' ? resolvedOptions : undefined,
        currencyProbe: undefined,
        availableCalendars: undefined,
      }
      if (name === 'DateTimeFormat') {
        const availableCalendars = ownValue(constructor, availableCalendarsKey)
        if (typeof availableCalendars === 'function')
          provider.availableCalendars = () =>
            apply(availableCalendars, constructor, [])
        const hasTimeZone = ownValue(constructor, hasTimeZoneKey)
        if (typeof hasTimeZone === 'function')
          provider.hasTimeZone = (name: string) =>
            apply(hasTimeZone, constructor, [name])
      }
      if (name === 'DisplayNames') {
        const property = findMethod(constructor, 'of')
        const of = property && ownValue(property, 'value')
        if (typeof of === 'function')
          provider.currencyName = (formatter, code) =>
            apply(of, formatter, [code])
      }
      if (name === 'NumberFormat') {
        const parts = findMethod(constructor, 'formatToParts')
        const formatToParts = parts && ownValue(parts, 'value')
        const format = findMethod(constructor, 'format')
        const getter = format && ownValue(format, 'get')
        const method = format && ownValue(format, 'value')
        if (typeof formatToParts === 'function') {
          // ECMA-402 §6.4: recognize a localized currency name without
          // including the surrounding number-pattern literals.
          // https://tc39.es/ecma402/#sec-availablecanonicalcurrencies
          provider.currencyProbe = (formatter, code) => {
            const parts = apply(
              formatToParts,
              formatter,
              [123]
            ) as Intl.NumberFormatPart[]
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i]
              if (part.type === 'currency' && part.value !== code) return true
            }
            return false
          }
        } else if (typeof getter === 'function') {
          provider.currencyProbe = formatter =>
            apply(apply(getter, formatter, []), undefined, [123])
        } else if (typeof method === 'function') {
          provider.currencyProbe = formatter => apply(method, formatter, [123])
        }
      }
      apply(weakSet, providers, [constructor, provider])
    }
    apply(mapSet, current, [name, provider])
    return provider
  }

  // ECMA-402 §8.3.2 step 9 creates a fresh intrinsic array with own data properties.
  // https://tc39.es/ecma262/#sec-createarrayfromlist
  function copyValues(values: string[]): string[] {
    const result: string[] = []
    for (let index = 0; index < values.length; index++) {
      defineProperty(result, index, {
        __proto__: null,
        value: values[index],
        writable: true,
        enumerable: true,
        configurable: true,
      } as PropertyDescriptor)
    }
    return result
  }

  type FormatterName =
    | 'DateTimeFormat'
    | 'Collator'
    | 'NumberFormat'
    | 'RelativeTimeFormat'
    | 'DisplayNames'
  const formatterNames = [
    'DateTimeFormat',
    'Collator',
    'NumberFormat',
    'DisplayNames',
  ] as const

  function constructorFor(category: string): FormatterName | undefined {
    if (category === 'calendar' || category === 'timeZone')
      return 'DateTimeFormat'
    if (category === 'collation') return 'Collator'
    if (category === 'currency') return 'NumberFormat'
  }

  // ECMA-402 §6.7.1 requires all three formatters for extra systems.
  // https://tc39.es/ecma402/#sec-availablecanonicalnumberingsystems
  function numberingProbe() {
    const number = getProvider('NumberFormat')
    const date = getProvider('DateTimeFormat')
    const relative = getProvider('RelativeTimeFormat')
    if (
      !number?.resolvedOptions ||
      !date?.resolvedOptions ||
      !relative?.resolvedOptions
    )
      return undefined
    function supports(provider: Provider, locale: string, system: string) {
      const formatter = construct(provider.constructor as Function, [locale])
      return (
        apply(provider.resolvedOptions as Function, formatter, [])
          .numberingSystem === system
      )
    }
    return (locale: string, system: string) =>
      supports(number, locale, system) &&
      supports(date, locale, system) &&
      supports(relative, locale, system)
  }

  // ECMA-402 §6.4 checks currency support in both installed services.
  // https://tc39.es/ecma402/#sec-availablecanonicalcurrencies
  function currencyProbe(
    provider: Provider | undefined,
    names: Provider | undefined
  ) {
    const format = provider?.currencyProbe
    if (!format || !names) return format
    const lookup = names.currencyName
    if (!lookup) return undefined
    const formatters = create(null) as Record<string, object | null | undefined>
    return (number: unknown, code: string, locale: string) => {
      let formatter = formatters[locale]
      if (formatter === undefined) {
        formatters[locale] = null
        formatter = formatters[locale] = construct(
          names.constructor as Function,
          [
            locale,
            {
              __proto__: null,
              type: 'currency',
              fallback: 'none',
            },
          ]
        )
      }
      return (
        formatter !== null &&
        lookup(formatter, code) !== undefined &&
        format(number, code)
      )
    }
  }

  // Locale loaders can change supported values after installation.
  function watch(constructor: object, name: FormatterName) {
    let state = apply(weakGet, watched, [constructor]) as
      | LoaderState
      | undefined
    if (!state) {
      state = {version: 0, loaders: new MapConstructor()}
      apply(weakSet, watched, [constructor, state])
    }
    let observesUpdates = false
    const names =
      name === 'DateTimeFormat'
        ? [
            '__addLocaleData',
            '__addCalendarLocaleData',
            '__addTZData',
            '__addCalendarData',
            '__setDefaultTimeZone',
          ]
        : ['__addLocaleData']
    for (let index = 0; index < names.length; index++) {
      const name = names[index]
      const property = descriptor(constructor, name)
      const data = property && descriptor(property, 'value')
      if ((!property && name in constructor) || (property && !data))
        return undefined
      const current = data?.value
      if (typeof current === 'function') observesUpdates = true
      if (apply(mapGet, state.loaders, [name]) === current) continue
      state.version++
      if (typeof current !== 'function') {
        apply(mapSet, state.loaders, [name, current])
        continue
      }
      if (!property || (!property.configurable && !property.writable))
        return undefined
      const record = state
      const wrapped = new ProxyConstructor(current, {
        __proto__: null,
        apply(target, receiver, args) {
          try {
            return apply(target, receiver, args)
          } finally {
            record.version++
          }
        },
      } as ProxyHandler<typeof current>)
      defineProperty(constructor, name, {
        __proto__: null,
        value: wrapped,
      } as PropertyDescriptor)
      apply(mapSet, state.loaders, [name, wrapped])
    }
    // A replacement can change its data without a public locale loader.
    if (!observesUpdates && ownValue(constructor, 'polyfilled'))
      return undefined
    return state
  }

  // ECMA-262 built-in functions: method syntax supplies name/length without
  // [[Construct]] or an own prototype. Installation uses native descriptors.
  // https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
  const supportedValuesOf = {
    supportedValuesOf(key: unknown) {
      // Intl.supportedValuesOf step 1: ToString, once, with the string hint.
      // Template conversion also rejects Symbols, unlike the String function.
      // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
      const category = `${key}`
      const name = constructorFor(category)
      const provider = name && getProvider(name)
      const names =
        category === 'currency' ? getProvider('DisplayNames') : undefined
      const availableCalendars =
        category === 'calendar' ? provider?.availableCalendars : undefined
      const hasTimeZone =
        category === 'timeZone' ? provider?.hasTimeZone : undefined
      const state =
        name && provider && !availableCalendars && !hasTimeZone
          ? watch(provider.constructor, name)
          : undefined
      const version = state?.version ?? 0
      const namesState = names && watch(names.constructor, 'DisplayNames')
      const namesVersion = namesState?.version ?? 0
      const canCache = state && (!names || namesState)
      const previous = apply(mapGet, cached, [category]) as Cached | undefined
      if (
        canCache &&
        previous &&
        previous.provider === provider &&
        previous.version === version &&
        previous.names === names &&
        previous.namesVersion === namesVersion
      )
        return copyValues(previous.values)

      // Steps 2–8 use the retained probe and let Rust select accepted values.
      // https://tc39.es/ecma402/#sec-intl.supportedvaluesof
      let calendars: readonly string[] | undefined
      try {
        calendars = availableCalendars?.()
      } catch {
        // Fall back to formatter probes if optional calendar metadata fails.
      }
      const values = nativeSupportedValuesOf(
        category,
        provider?.constructor,
        provider?.resolvedOptions,
        category === 'numberingSystem'
          ? numberingProbe()
          : category === 'currency'
            ? currencyProbe(provider, names)
            : hasTimeZone,
        makeOptions,
        calendars
      )
      if (values === null) throw new InvalidKeyError('Invalid key: ' + category)
      if (provider && canCache)
        apply(mapSet, cached, [
          category,
          {provider, version, names, namesVersion, values},
        ])
      return copyValues(values)
    },
  }.supportedValuesOf
  defineProperty(intl, 'supportedValuesOf', {
    value: supportedValuesOf,
    writable: true,
    enumerable: false,
    configurable: true,
  })
  function watchFormatters() {
    // Capture loaders before application code can retain their original methods.
    for (let index = 0; index < formatterNames.length; index++) {
      const name = formatterNames[index]
      const provider = getProvider(name)
      if (provider) watch(provider.constructor, name)
    }
    getProvider('RelativeTimeFormat')
  }
  watchFormatters()
  return watchFormatters
})
