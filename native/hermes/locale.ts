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
  const create = Object.create
  const defineProperty = Object.defineProperty
  const descriptor = Object.getOwnPropertyDescriptor
  const names = Object.getOwnPropertyNames
  const own = Object.prototype.hasOwnProperty
  const parse = JSON.parse
  const stringify = JSON.stringify
  const BadReceiver = TypeError
  const BadOption = RangeError
  const propertiesKey = Symbol()
  type Slot = object & {[propertiesKey]?: Readonly<Record<string, any>>}
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
        // Callers admit only misses; avoid a second lookup of the same key.
        if (size === 64) {
          clear()
          size = 0
        }
        size++
        set(key, value)
      },
    }
  }
  const constructors = boundedCache<string, Slot>()
  const transforms = boundedCache<Slot, [Slot | undefined, Slot | undefined]>()
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const previousToString = intl.Locale?.prototype?.toString
  const enumerate = intl.supportedValuesOf

  function slot(receiver: unknown) {
    const value = getSlot(receiver)
    if (!value) throw new BadReceiver('Incompatible Intl.Locale receiver')
    return value as Slot
  }
  function query(record: Slot, request: string): any {
    return parse(nativeQuery(record, request))
  }
  function properties(record: Slot): Readonly<Record<string, any>> {
    // Only immutable scalars are shared; capability queries still run per call.
    const cached = record[propertiesKey]
    if (cached !== undefined) return cached
    const result = query(record, '{"method":"properties"}')
    // HostObject setters reject assignment; define private metadata directly.
    defineProperty(record, propertiesKey, {
      __proto__: null,
      value: result,
    } as PropertyDescriptor)
    return result
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
      record = handle
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
      const handle = nativeTransform(source, kind)
      record = handle
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
  // Intl.Locale 1–6:
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L19-L27
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
      // Steps 7–9: strings/objects only; genuine Locale tags bypass user coercion.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L28-L31
      if (
        typeof tag !== 'string' &&
        (tag === null || (typeof tag !== 'object' && typeof tag !== 'function'))
      )
        throw new BadReceiver('tag must be a string or object')
      const existing = typeof tag === 'string' ? undefined : getSlot(tag)
      if (existing) tag = properties(existing).locale
      else {
        let intrinsicTag: string | undefined
        if (typeof previousToString === 'function' && typeof tag !== 'string') {
          try {
            intrinsicTag = apply(previousToString, tag, [])
          } catch {
            /* Brand mismatch. */
          }
        }
        tag = intrinsicTag === undefined ? `${tag}` : intrinsicTag
      }
      // Steps 10–14: options coercion precedes tag validation; canonicalization
      // precedes every language override getter. Rust owns tag syntax/aliases.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L32-L36
      // Without option getters, Rust can validate/canonicalize in one call.
      if (optionsInput === undefined)
        return initialize(receiver, tag as string, '{}')
      const options: any = optionsInput
      if (
        options === null ||
        (typeof options !== 'object' && typeof options !== 'function')
      )
        throw new BadReceiver('options must be an object')
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
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L89-L108
      option('language')
      option('script')
      option('region')
      option('variants')
      // Constructor 16–35: string options in spec order; numeric uses ToBoolean.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L38-L61
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
      // MakeLocaleRecord + constructor 36–46: Rust canonicalizes the overrides;
      // only successful initialization installs the private JS brand.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L62-L78
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
    get baseName() {
      return property(this, 'baseName')
    },
    get language() {
      return property(this, 'language')
    },
    get script() {
      return property(this, 'script')
    },
    get region() {
      return property(this, 'region')
    },
    get variants() {
      return property(this, 'variants')
    },
    get calendar() {
      return property(this, 'calendar')
    },
    get collation() {
      return property(this, 'collation')
    },
    get firstDayOfWeek() {
      return property(this, 'firstDayOfWeek')
    },
    get hourCycle() {
      return property(this, 'hourCycle')
    },
    get caseFirst() {
      return property(this, 'caseFirst')
    },
    get numeric() {
      return property(this, 'numeric')
    },
    get numberingSystem() {
      return property(this, 'numberingSystem')
    },
    toString() {
      return properties(slot(this)).locale
    },
    // These methods create %Intl.Locale% instances, independent of a receiver's
    // constructor property, preserving variants and extensions in Rust.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L279-L295
    maximize() {
      return transform(this, 0)
    },
    minimize() {
      return transform(this, 1)
    },
    getCalendars() {
      return query(slot(this), '{"method":"calendars"}')
    },
    getHourCycles() {
      return query(slot(this), '{"method":"hourCycles"}')
    },
    getTimeZones() {
      const value = query(slot(this), '{"method":"timeZones"}')
      return value === null ? undefined : value
    },
    getTextInfo() {
      const value = query(slot(this), '{"method":"textInfo"}')
      // The spec requires an own direction property even when unknown.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L752-L755
      return {
        direction: apply(own, value, ['direction'])
          ? value.direction
          : undefined,
      }
    },
    getWeekInfo() {
      return query(slot(this), '{"method":"weekInfo"}')
    },
    getNumberingSystems() {
      const record = slot(this)
      const metadata = properties(record)
      let defaultSystem: string | undefined
      // NumberingSystemsOfLocale 1–5: query the actual formatter at call time.
      // Explicit nu bypasses the formatter, and unsupported locales use latn.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L715-L727
      if (metadata.numberingSystem === null) {
        const NumberFormat = intl.NumberFormat
        if (
          typeof NumberFormat === 'function' &&
          NumberFormat.supportedLocalesOf([metadata.locale], {
            localeMatcher: 'lookup',
          }).length
        ) {
          defaultSystem = new NumberFormat(metadata.locale, {
            localeMatcher: 'lookup',
          }).resolvedOptions().numberingSystem
        }
      }
      return query(
        record,
        '{"method":"numberingSystems","defaultNumberingSystem":' +
          (defaultSystem === undefined ? 'null' : quote(defaultSystem)) +
          '}'
      )
    },
    getCollations() {
      const record = slot(this)
      const metadata = properties(record)
      let candidates: string[] = [],
        accepted = '['
      let matched = false,
        separator = ''
      // CollationsOfLocale 1–6: explicit co restricts; otherwise intersect global
      // candidates with this locale's actual Collator support. No capability cache.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L661-L674
      if (metadata.collation === null) {
        const Collator = intl.Collator
        matched =
          typeof Collator === 'function' &&
          !!Collator.supportedLocalesOf([metadata.locale], {
            localeMatcher: 'lookup',
          }).length
        if (matched) {
          candidates =
            typeof enumerate === 'function'
              ? apply(enumerate, intl, ['collation'])
              : []
          for (let index = 0; index < candidates.length; index++) {
            const collation = candidates[index]
            if (
              new Collator(metadata.locale, {
                collation,
                localeMatcher: 'lookup',
              }).resolvedOptions().collation === collation
            ) {
              accepted += separator + quote(collation)
              separator = ','
            }
          }
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
  defineProperty(prototype, 'constructor', {
    value: Locale,
    writable: true,
    configurable: true,
  })
  defineProperty(prototype, Symbol.toStringTag, {
    value: 'Intl.Locale',
    configurable: true,
  })
  defineProperty(target, 'prototype', {writable: false})
  defineProperty(Locale, 'polyfilled', {value: true})
  defineProperty(intl, 'Locale', {
    value: Locale,
    writable: true,
    enumerable: false,
    configurable: true,
  })
})
