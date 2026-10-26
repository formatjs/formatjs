// eslint-disable-next-line no-unused-expressions -- Hermes evaluates this factory.
;(function (native: {
  canonicalTag: (tag: string) => string | null
  nativeCreate: (tag: string, options: string) => object | null
  nativeValidate: (name: string, value: string) => boolean
  nativeQuery: (handle: object, request: string) => string
}) {
  'use strict'
  const {canonicalTag, nativeCreate, nativeValidate, nativeQuery} = native
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
  const slots = new WeakMap<
    object,
    {handle: object; properties: Record<string, any>}
  >()
  const getSlot = WeakMap.prototype.get
  const setSlot = WeakMap.prototype.set
  const root = globalThis as any
  const intl = root.Intl || (root.Intl = {})
  const previousToString = intl.Locale?.prototype?.toString
  const enumerate = intl.supportedValuesOf

  function slot(receiver: unknown) {
    const value = apply(getSlot, slots, [receiver])
    if (!value) throw new BadReceiver('Incompatible Intl.Locale receiver')
    return value as {handle: object; properties: Record<string, any>}
  }
  function query(record: {handle: object}, request: string): any {
    return parse(nativeQuery(record.handle, request))
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

  // Proxy construction performs OrdinaryCreateFromConstructor once, including
  // its fallback to %Intl.Locale.prototype% for a non-object prototype. An
  // ordinary JS constructor would use %Object.prototype% for that fallback.
  // Intl.Locale 1–6:
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L19-L27
  const target = function Locale(_tag: unknown) {
    throw new BadReceiver("Intl.Locale must be called with 'new'")
  }
  const prototype = target.prototype
  const Locale = new Proxy(target, {
    construct(_target, args, newTarget) {
      const requestedPrototype = newTarget.prototype
      const receiver = create(
        requestedPrototype !== null &&
          (typeof requestedPrototype === 'object' ||
            typeof requestedPrototype === 'function')
          ? requestedPrototype
          : prototype
      )
      let tag = args[0]
      // Steps 7–9: strings/objects only; genuine Locale tags bypass user coercion.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L28-L31
      if (
        typeof tag !== 'string' &&
        (tag === null || (typeof tag !== 'object' && typeof tag !== 'function'))
      )
        throw new BadReceiver('tag must be a string or object')
      const existing = apply(getSlot, slots, [tag])
      if (existing) tag = existing.properties.locale
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
      const options = args[1] === undefined ? create(null) : args[1]
      if (
        options === null ||
        (typeof options !== 'object' && typeof options !== 'function')
      )
        throw new BadReceiver('options must be an object')
      const canonical = canonicalTag(tag)
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
      const handle = nativeCreate(canonical, encoded + '}')
      if (handle === null)
        throw new BadOption('Invalid language tag or options')
      const properties = query({handle}, '{"method":"properties"}')
      apply(setSlot, slots, [receiver, {handle, properties}])
      return receiver
    },
  }) as unknown as {new (tag: unknown, options?: unknown): object}

  function property(receiver: unknown, name: string): any {
    const value = slot(receiver).properties[name]
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
      return slot(this).properties.locale
    },
    // These methods create %Intl.Locale% instances, independent of a receiver's
    // constructor property, preserving variants and extensions in Rust.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L279-L295
    maximize() {
      return new Locale(query(slot(this), '{"method":"maximize"}'))
    },
    minimize() {
      return new Locale(query(slot(this), '{"method":"minimize"}'))
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
      let defaultSystem: string | undefined
      // NumberingSystemsOfLocale 1–5: query the actual formatter at call time.
      // Explicit nu bypasses the formatter, and unsupported locales use latn.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L715-L727
      if (record.properties.numberingSystem === null) {
        const NumberFormat = intl.NumberFormat
        if (
          typeof NumberFormat === 'function' &&
          NumberFormat.supportedLocalesOf([record.properties.locale], {
            localeMatcher: 'lookup',
          }).length
        ) {
          defaultSystem = new NumberFormat(record.properties.locale, {
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
      let candidates: string[] = [],
        accepted = '['
      let matched = false,
        separator = ''
      // CollationsOfLocale 1–6: explicit co restricts; otherwise intersect global
      // candidates with this locale's actual Collator support. No capability cache.
      // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L661-L674
      if (record.properties.collation === null) {
        const Collator = intl.Collator
        matched =
          typeof Collator === 'function' &&
          !!Collator.supportedLocalesOf([record.properties.locale], {
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
              new Collator(record.properties.locale, {
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
  defineProperty(intl, 'Locale', {
    value: Locale,
    writable: true,
    enumerable: false,
    configurable: true,
  })
})
