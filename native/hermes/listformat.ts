// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  nativeLoad: (pack: string) => number
  nativeInfo: () => string | number
  nativeMatch: (request: string) => string | number
  nativeCapture: (request: string) => object | number
  nativeCreate: (snapshot: object, options: string) => object | number
  nativeCreateDefault: (requested: string) => object | number
  nativeQuery: (handle: object, request: string) => string | number
  nativeFormat: (handle: object, values: string[]) => string
  nativeParts: (handle: object, values: string[]) => string
  nativeFormatSmall: (handle: object, ...values: string[]) => string
  nativePartsSmall: (handle: object, ...values: string[]) => string
}) {
  'use strict'
  const {
    nativeLoad,
    nativeInfo,
    nativeMatch,
    nativeCapture,
    nativeCreate,
    nativeCreateDefault,
    nativeQuery,
    nativeFormat,
    nativeParts,
    nativeFormatSmall,
    nativePartsSmall,
  } = native
  const apply = Reflect.apply
  const join = Array.prototype.join
  const create = Object.create
  const define = Object.defineProperty
  const setPrototypeOf = Object.setPrototypeOf
  const object = Object
  const objectPrototype = Object.prototype
  const parse = JSON.parse
  const stringify = JSON.stringify
  const charCodeAt = Function.prototype.call.bind(String.prototype.charCodeAt)
  const slice = Function.prototype.call.bind(String.prototype.slice)
  const BadReceiver = TypeError
  const BadOption = RangeError
  // ECMA-402 §14.4: the native handle owns the instance's locale and patterns.
  // https://tc39.es/ecma402/#sec-properties-of-intl-listformat-instances
  const slots = new WeakMap<object, object>()
  const getSlot = WeakMap.prototype.get.bind(slots) as (
    receiver: unknown
  ) => object | undefined
  const setSlot = WeakMap.prototype.set.bind(slots)
  type JoinPlan = {separator: string; lastSeparator: string}
  // Private handle metadata avoids another set of weak keys during collection.
  const planKey = Symbol()
  type Handle = {[planKey]?: JoinPlan | null | false}
  const matchers = ['lookup', 'best fit'] as const
  const types = ['conjunction', 'disjunction', 'unit'] as const
  const styles = ['long', 'short', 'narrow'] as const
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const canonicalize = intl.getCanonicalLocales
  if (typeof canonicalize !== 'function')
    throw new BadReceiver('Install Intl.getCanonicalLocales before ListFormat')

  function decoded(value: string | number): any {
    if (typeof value === 'number')
      throw new BadOption('Invalid Intl.ListFormat options or locale data')
    return parse(value)
  }
  function quote(value: string): string {
    return stringify(value)!
  }
  function options(value: unknown): any {
    if (value === undefined) return create(null)
    if (value === null) throw new BadReceiver('options must not be null')
    return object(value)
  }
  function constructorOptions(value: unknown): any {
    if (value === undefined) return create(null)
    if (!isObject(value)) throw new BadReceiver('options must be an object')
    return value
  }
  function option(
    options: any,
    name: string,
    choices: readonly string[],
    fallback: string
  ): string {
    const value = options[name]
    if (value === undefined) return fallback
    const text = `${value}`
    for (let index = 0; index < choices.length; index++)
      if (text === choices[index]) return text
    throw new BadOption('Invalid Intl.ListFormat option: ' + name)
  }
  function isObject(value: unknown): boolean {
    return (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function')
    )
  }
  function slot(receiver: unknown): object {
    const handle = getSlot(receiver)
    if (!handle) throw new BadReceiver('Incompatible Intl.ListFormat receiver')
    return handle
  }
  function matchRequest(
    requested: string[],
    lookup: boolean,
    supported: boolean
  ): string {
    return (
      '{"requested":' +
      strings(requested) +
      ',"lookup":' +
      lookup +
      ',"supported":' +
      supported +
      '}'
    )
  }
  function strings(requested: string[]): string {
    let tags = '['
    for (let index = 0; index < requested.length; index++)
      tags += (index ? ',' : '') + quote(requested[index])
    return tags + ']'
  }
  function initialize(receiver: object, handle: object | number): ListFormat {
    if (typeof handle === 'number') decoded(handle)
    setSlot(receiver, handle as object)
    return receiver
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
  function callList(
    input: unknown,
    handle: object,
    small: (handle: object, ...values: string[]) => string,
    large: (handle: object, values: string[]) => string
  ): string {
    // ECMA-402 §14.5.5 steps 1–4: close the iterator on a non-string value.
    // https://tc39.es/ecma402/#sec-createstringlistfromiterable
    if (input === undefined) return small(handle)
    let first = '',
      second = '',
      third = '',
      fourth = ''
    let length = 0
    let values: string[] | undefined
    for (const value of input as Iterable<unknown>) {
      if (typeof value !== 'string')
        throw new BadReceiver('Iterable yielded a non-string value')
      if (values !== undefined) {
        values[length++] = value
        continue
      }
      switch (length) {
        case 0:
          first = value
          break
        case 1:
          second = value
          break
        case 2:
          third = value
          break
        case 3:
          fourth = value
          break
        default:
          values = [first, second, third, fourth]
          // Larger copies stay private; inherited index setters cannot observe them.
          setPrototypeOf(values, null)
          values[length] = value
      }
      length++
    }
    switch (length) {
      case 0:
        return small(handle)
      case 1:
        return small(handle, first)
      case 2:
        return small(handle, first, second)
      case 3:
        return small(handle, first, second, third)
      case 4:
        return small(handle, first, second, third, fourth)
      default:
        // Rust authorizes only context-free separators; keep all other shapes native.
        if (large === nativeFormat) {
          const record = handle as Handle
          let plan = record[planKey]
          // Long lists repay setup immediately; shorter lists wait for reuse.
          if (plan === undefined && length < 128) {
            define(record, planKey, {
              __proto__: null,
              value: false,
              writable: true,
            } as PropertyDescriptor)
            return large(handle, values!)
          }
          if (plan === undefined || plan === false) {
            plan = decoded(
              nativeQuery(handle, '{"method":"joinPlan"}')
            ) as JoinPlan | null
            define(record, planKey, {
              __proto__: null,
              value: plan,
              writable: true,
            } as PropertyDescriptor)
          }
          if (plan !== null) {
            const last = values![length - 1]
            values!.length = length - 1
            return (
              apply(join, values!, [plan.separator]) + plan.lastSeparator + last
            )
          }
        }
        return large(handle, values!)
    }
  }
  // ECMA-402 §14.1.1 steps 1–6: allocate before ResolveOptions. A derived constructor
  // avoids Hermes allocating from newTarget.prototype before our explicit Get.
  // https://tc39.es/ecma402/#sec-Intl.ListFormat
  class ListFormat extends null {
    constructor(
      locales: unknown = undefined,
      optionsInput: unknown = undefined
    ) {
      const requestedPrototype = new.target.prototype
      const receiver = create(
        isObject(requestedPrototype) ? requestedPrototype : prototype
      )
      const requested = canonicalize(locales) as string[]
      // Missing options have no getters; Rust can negotiate and create together.
      if (optionsInput === undefined)
        return initialize(receiver, nativeCreateDefault(strings(requested)))
      const opts = constructorOptions(optionsInput)
      const matcher = option(opts, 'localeMatcher', matchers, 'best fit')
      const snapshot = nativeCapture(
        matchRequest(requested, matcher === 'lookup', false)
      )
      if (typeof snapshot === 'number') return decoded(snapshot)
      // Steps 7–14: get/validate type before reading style; Rust selects templates.
      // https://tc39.es/ecma402/#sec-Intl.ListFormat
      const type = option(opts, 'type', types, 'conjunction')
      const style = option(opts, 'style', styles, 'long')
      const handle = nativeCreate(
        snapshot,
        '{"type":"' + type + '","style":"' + style + '"}'
      )
      return initialize(receiver, handle)
    }
    static supportedLocalesOf(
      locales: unknown,
      optionsInput: unknown = undefined
    ): string[] {
      // ECMA-402 §14.2.2 steps 2–3: canonicalize before reading options.
      // https://tc39.es/ecma402/#sec-Intl.ListFormat.supportedLocalesOf
      const requested = canonicalize(locales) as string[]
      const matcher = option(
        options(optionsInput),
        'localeMatcher',
        matchers,
        'best fit'
      )
      return decoded(
        nativeMatch(matchRequest(requested, matcher === 'lookup', true))
      )
    }
    static __addLocaleData(...packs: unknown[]): void {
      for (let index = 0; index < packs.length; index++) {
        if (typeof packs[index] !== 'string')
          throw new BadReceiver('Expected list locale JSON string')
        const status = nativeLoad(packs[index] as string)
        if (status !== 0) decoded(status)
      }
    }
    static getDefaultLocale(): string {
      return decoded(nativeInfo()).default || ''
    }
  }
  // ECMA-402 §14.3.1: class syntax supplies the prototype's constructor.
  // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype.constructor
  const prototype = ListFormat.prototype
  setPrototypeOf(prototype, objectPrototype)
  const members = {
    format(this: unknown, list: unknown): string {
      // ECMA-402 §14.3.3 steps 2–4: check the receiver before iteration.
      // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype.format
      const handle = slot(this)
      return callList(list, handle, nativeFormatSmall, nativeFormat)
    },
    formatToParts(this: unknown, list: unknown): object[] {
      // ECMA-402 §14.3.4 delegates to §14.5.4 for fresh arrays and part objects.
      // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype.formatToParts
      // https://tc39.es/ecma402/#sec-formatlisttoparts
      const handle = slot(this)
      const packed = callList(list, handle, nativePartsSmall, nativeParts)
      const parts: object[] = []
      const descriptor = {
        __proto__: null,
        value: undefined as unknown,
        writable: true,
        enumerable: true,
        configurable: true,
      }
      for (let offset = 0; offset < packed.length;) {
        const kind = charCodeAt(packed, offset++)
        const length =
          charCodeAt(packed, offset++) * 65536 + charCodeAt(packed, offset++)
        const value = slice(packed, offset, offset + length)
        offset += length
        const part = {type: kind === 0 ? 'element' : 'literal', value}
        descriptor.value = part
        define(parts, parts.length, descriptor)
      }
      return parts
    },
    resolvedOptions(this: unknown): object {
      // ECMA-402 §14.3.2 steps 2–5: require the slot and define own properties.
      // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype.resolvedoptions
      const values = decoded(
        nativeQuery(slot(this), '{"method":"resolvedOptions"}')
      )
      const result = create(objectPrototype)
      property(result, 'locale', values.locale, true)
      property(result, 'type', values.type, true)
      property(result, 'style', values.style, true)
      return result
    },
  }
  const names: (keyof typeof members)[] = [
    'format',
    'formatToParts',
    'resolvedOptions',
  ]
  for (let index = 0; index < names.length; index++)
    property(prototype, names[index], members[names[index]])
  // ECMA-402 §14.3.5 https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype-toStringTag
  property(prototype, Symbol.toStringTag, 'Intl.ListFormat', false, false)
  property(ListFormat, 'polyfilled', true)
  // ECMA-402 §14.2.1 fixes the constructor's prototype property.
  // https://tc39.es/ecma402/#sec-Intl.ListFormat.prototype
  const descriptor = create(null)
  descriptor.writable = false
  define(ListFormat, 'prototype', descriptor)
  // ECMA-402 §8.2.5 exposes %Intl.ListFormat% on Intl.
  // https://tc39.es/ecma402/#sec-intl.listformat-intro
  property(intl, 'ListFormat', ListFormat)
})
