import {memoize, strategies} from '@formatjs/fast-memoize'

const descriptor = Object.getOwnPropertyDescriptor
const getPrototypeOf = Object.getPrototypeOf
const objectPrototype = Object.prototype
const apply = Reflect.apply
const memoizeOptions = {__proto__: null, strategy: strategies.variadic}
const availableCalendarsKey = Symbol.for(
  '@formatjs/intl-datetimeformat/availableCalendars'
)
const hasTimeZoneKey = Symbol.for('@formatjs/intl-datetimeformat/hasTimeZone')

function ownValue(object: object, key: PropertyKey): unknown {
  const property = descriptor(object, key)
  return property && descriptor(property, 'value')?.value
}

function findProperty(
  owner: unknown,
  key: string
): PropertyDescriptor | undefined {
  while (
    owner !== null &&
    (typeof owner === 'object' || typeof owner === 'function') &&
    owner !== objectPrototype
  ) {
    const property = descriptor(owner, key)
    if (property) return property
    owner = getPrototypeOf(owner)
  }
}

function resolvedOptions<T, R>(
  Constructor: object
): ((formatter: T) => R) | undefined {
  const property = findProperty(
    ownValue(Constructor, 'prototype'),
    'resolvedOptions'
  )
  const method = property && ownValue(property, 'value')
  if (typeof method === 'function')
    return formatter => apply(method, formatter, [])
}

let intl = ownValue(globalThis, 'Intl') as typeof Intl | undefined

type FormatterName =
  | 'DateTimeFormat'
  | 'NumberFormat'
  | 'Collator'
  | 'RelativeTimeFormat'
  | 'DisplayNames'

// ECMA-402 §8.3.2 steps 2–7 use implementation data. Retain probe operations
// without calling public getters, including when a provider is installed later.
// https://tc39.es/ecma402/#sec-intl.supportedvaluesof
function retainProbe<K extends FormatterName, P>(
  name: K,
  createProbe: (constructor: (typeof Intl)[K]) => P
): () => P | undefined {
  const probes = new WeakMap<(typeof Intl)[K], P>()
  const readProbe = probes.get.bind(probes)
  const writeProbe = probes.set.bind(probes)
  let currentProbe: P | undefined
  const getProbe = () => {
    intl ??= ownValue(globalThis, 'Intl') as typeof Intl | undefined
    const property = intl && descriptor(intl, name)
    const data = property && descriptor(property, 'value')
    if (!data) return currentProbe
    const candidate = data.value
    if (typeof candidate !== 'function') return undefined
    const Constructor = candidate as (typeof Intl)[K]
    let probe = readProbe(Constructor)
    if (probe === undefined) {
      probe = createProbe(Constructor)
      writeProbe(Constructor, probe)
    }
    currentProbe = probe
    return probe
  }
  getProbe()
  return getProbe
}

function memoizeHost<T extends (...args: any[]) => any>(
  Constructor: object,
  construct: T
): T {
  // FormatJS data can change after installation. Probe its current registry.
  const marker = findProperty(Constructor, 'polyfilled')
  return marker && ownValue(marker, 'value')
    ? construct
    : (memoize(construct, memoizeOptions) as T)
}

interface FormatterProbe<Instance, Options, Resolved> {
  create: (locale: string, options?: Options) => Instance
  resolve: ((formatter: Instance) => Resolved) | undefined
}

interface DateTimeFormatProbe extends FormatterProbe<
  Intl.DateTimeFormat,
  Intl.DateTimeFormatOptions,
  Intl.ResolvedDateTimeFormatOptions
> {
  availableCalendars: (() => readonly string[]) | undefined
  hasTimeZone: ((name: string) => boolean) | undefined
}

interface NumberFormatProbe extends FormatterProbe<
  Intl.NumberFormat,
  Intl.NumberFormatOptions,
  Intl.ResolvedNumberFormatOptions
> {
  format: ((formatter: Intl.NumberFormat, value: number) => string) | undefined
  formatToParts:
    | ((formatter: Intl.NumberFormat, value: number) => Intl.NumberFormatPart[])
    | undefined
}

type CollatorProbe = FormatterProbe<
  Intl.Collator,
  Intl.CollatorOptions,
  Intl.ResolvedCollatorOptions
>

export const getDateTimeFormatProbe: () => DateTimeFormatProbe | undefined =
  retainProbe('DateTimeFormat', (Constructor: typeof Intl.DateTimeFormat) => {
    const availableCalendars = ownValue(Constructor, availableCalendarsKey)
    const hasTimeZone = ownValue(Constructor, hasTimeZoneKey)
    return {
      create: memoizeHost(
        Constructor,
        (locales: string, options?: Intl.DateTimeFormatOptions) =>
          new Constructor(locales, options)
      ),
      resolve: resolvedOptions<
        Intl.DateTimeFormat,
        Intl.ResolvedDateTimeFormatOptions
      >(Constructor),
      availableCalendars:
        typeof availableCalendars === 'function'
          ? (): readonly string[] => apply(availableCalendars, Constructor, [])
          : undefined,
      hasTimeZone:
        typeof hasTimeZone === 'function'
          ? (name: string): boolean => apply(hasTimeZone, Constructor, [name])
          : undefined,
    }
  })

export const getNumberFormatProbe: () => NumberFormatProbe | undefined =
  retainProbe('NumberFormat', (Constructor: typeof Intl.NumberFormat) => {
    // §16.3.3 exposes the bound format operation through this getter.
    // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.format
    const property = findProperty(ownValue(Constructor, 'prototype'), 'format')
    const getter = property && ownValue(property, 'get')
    const method = property && ownValue(property, 'value')
    const partsProperty = findProperty(
      ownValue(Constructor, 'prototype'),
      'formatToParts'
    )
    const parts = partsProperty && ownValue(partsProperty, 'value')
    let format:
      | ((formatter: Intl.NumberFormat, value: number) => string)
      | undefined
    if (typeof getter === 'function') {
      format = (formatter, value) =>
        apply(apply(getter, formatter, []), undefined, [value])
    } else if (typeof method === 'function') {
      format = (formatter, value) => apply(method, formatter, [value])
    }
    return {
      create: memoizeHost(
        Constructor,
        (locales: string, options?: Intl.NumberFormatOptions) =>
          new Constructor(locales, options)
      ),
      resolve: resolvedOptions<
        Intl.NumberFormat,
        Intl.ResolvedNumberFormatOptions
      >(Constructor),
      format,
      formatToParts:
        typeof parts === 'function'
          ? (formatter, value) => apply(parts, formatter, [value])
          : undefined,
    }
  })

export const getCollatorProbe: () => CollatorProbe | undefined = retainProbe(
  'Collator',
  (Constructor: typeof Intl.Collator) => ({
    create: (locale: string): Intl.Collator => new Constructor(locale),
    resolve: resolvedOptions<Intl.Collator, Intl.ResolvedCollatorOptions>(
      Constructor
    ),
  })
)

type RelativeTimeFormatProbe = FormatterProbe<
  Intl.RelativeTimeFormat,
  Intl.RelativeTimeFormatOptions,
  Intl.ResolvedRelativeTimeFormatOptions
>

export const getRelativeTimeFormatProbe: () =>
  | RelativeTimeFormatProbe
  | undefined = retainProbe('RelativeTimeFormat', Constructor => ({
  create: (locale: string) => new Constructor(locale),
  resolve: resolvedOptions<
    Intl.RelativeTimeFormat,
    Intl.ResolvedRelativeTimeFormatOptions
  >(Constructor),
}))

interface CurrencyDisplayNamesProbe {
  create(locale: string): Intl.DisplayNames
  hasName: ((formatter: Intl.DisplayNames, code: string) => boolean) | undefined
}

export const getCurrencyDisplayNamesProbe: () =>
  | CurrencyDisplayNamesProbe
  | undefined = retainProbe('DisplayNames', Constructor => {
  const property = findProperty(ownValue(Constructor, 'prototype'), 'of')
  const of = property && ownValue(property, 'value')
  return {
    create: (locale: string) =>
      new Constructor(locale, {
        __proto__: null,
        type: 'currency',
        fallback: 'none',
      } as Intl.DisplayNamesOptions),
    hasName:
      typeof of === 'function'
        ? (formatter: Intl.DisplayNames, code: string) =>
            apply(of, formatter, [code]) !== undefined
        : undefined,
  }
})
