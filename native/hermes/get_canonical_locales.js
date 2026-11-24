// ECMA-402 §8.3.1, steps 1–2.
// https://tc39.es/ecma402/#sec-intl.getcanonicallocales
// eslint-disable-next-line no-unused-expressions -- JSI consumes the evaluated factory.
;(function (canonicalize) {
  'use strict'
  var defineProperty = Object.defineProperty
  var toObject = Object
  var toString = String
  var apply = Reflect.apply
  var isArray = Array.isArray
  var floor = Math.floor
  var TypeErrorIntrinsic = TypeError
  var RangeErrorIntrinsic = RangeError
  var intl = globalThis.Intl
  if (intl === undefined) {
    intl = {}
    defineProperty(globalThis, 'Intl', {
      __proto__: null,
      value: intl,
      writable: true,
      configurable: true,
    })
  }
  // ECMA-402 §8.1.1 gives the Intl namespace a non-writable tag.
  // https://tc39.es/ecma402/#sec-intl-%symbol.tostringtag%
  if (!Object.getOwnPropertyDescriptor(intl, Symbol.toStringTag)) {
    defineProperty(intl, Symbol.toStringTag, {
      __proto__: null,
      value: 'Intl',
      configurable: true,
    })
  }
  var Locale = intl.Locale
  var registry = intl.getCanonicalLocales?.__localeBrandRegistry ??
    Locale?.__localeBrandRegistry ?? {readers: undefined, parent: undefined}

  // Share the TS registry with canonicalizers and Locale constructors already in use.
  function rootRegistry() {
    var root = registry
    while (root.parent) root = root.parent
    return root
  }
  function addLocaleBrandReader(read) {
    if (typeof read !== 'function')
      throw new TypeErrorIntrinsic('Locale brand reader must be callable')
    var root = rootRegistry()
    for (var node = root.readers; node; node = node.next)
      if (node.read === read) return
    root.readers = {read: read, next: root.readers}
  }
  if (Locale && !Locale.__localeBrandRegistry) {
    var localeToString = Locale.prototype.toString
    if (typeof localeToString === 'function')
      addLocaleBrandReader(function (value) {
        try {
          if (!isArray(value)) return apply(localeToString, value, [])
        } catch {}
      })
  }
  var tagCache = new Map()
  var cachedTag = Map.prototype.get.bind(tagCache)
  var storeTag = Map.prototype.set.bind(tagCache)
  var clearTags = Map.prototype.clear.bind(tagCache)
  var cacheSize = 0

  function canonicalTag(tag) {
    var shortTag = tag.length <= 128
    var result = shortTag ? cachedTag(tag) : undefined
    if (result === undefined) {
      result = canonicalize(tag)
      if (result === null)
        throw new RangeErrorIntrinsic('Invalid language tag: ' + tag)
      // Compiled canonicalization data is immutable. Retain only short,
      // successful string results; coercion and public arrays remain per-call.
      if (shortTag && result.length <= 128) {
        if (cacheSize === 64) {
          clearTags()
          cacheSize = 0
        }
        storeTag(tag, result)
        cacheSize++
      }
    }
    return result
  }

  // ECMA-402 §9.2.1, steps 3 and 7.c.iii. Read the brand and tag before coercion.
  // https://tc39.es/ecma402/#sec-canonicalizelocalelist
  function localeString(value) {
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function')
    )
      return undefined
    for (var node = rootRegistry().readers; node; node = node.next) {
      var tag = node.read(value)
      if (typeof tag === 'string') return tag
    }
    return undefined
  }

  // Method syntax supplies name, length 1, and no [[Construct]] or prototype.
  // https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
  var getCanonicalLocales = {
    getCanonicalLocales(locales) {
      // CanonicalizeLocaleList 1–1.a: omitted input returns an empty list.
      if (locales === undefined) return []
      // CanonicalizeLocaleList 4.a: ToObject rejects null.
      // https://tc39.es/ecma262/#sec-toobject
      if (locales === null)
        throw new TypeErrorIntrinsic('Cannot convert null to an object')
      if (typeof locales === 'string') return [canonicalTag(locales)]
      // CanonicalizeLocaleList 3–4.a: singleton array for a string/Locale tag;
      // otherwise box with ToObject. Array literals create own elements.
      // https://tc39.es/ecma262/#sec-createarrayfromlist
      var single = localeString(locales)
      if (single !== undefined) return [canonicalTag(single)]
      var list = toObject(locales)
      // CanonicalizeLocaleList 5: LengthOfArrayLike reads/coerces length once,
      // then ToLength truncates and clamps to 2^53 - 1. Unary + rejects BigInt.
      // https://tc39.es/ecma262/#sec-lengthofarraylike
      // https://tc39.es/ecma262/#sec-tolength
      var length = +list.length
      var len =
        length !== length || length <= 0
          ? 0
          : length > 9007199254740991
            ? 9007199254740991
            : floor(length)
      // CanonicalizeLocaleList 2: private array represents seen; allocation is unobservable.
      var result = []
      // Steps 6–7, 7.d: start at zero, visit in order, increment after each entry.
      for (var k = 0; k < len; k++) {
        // Steps 7.a–c.i: numeric keys become strings; HasProperty precedes Get.
        // https://tc39.es/ecma262/#sec-hasproperty
        // https://tc39.es/ecma262/#sec-get-o-p
        if (!(k in list)) continue
        var value = list[k]
        var type = typeof value
        // CanonicalizeLocaleList 7.c.ii: only string/object entries are accepted.
        if (
          value === null ||
          (type !== 'string' && type !== 'object' && type !== 'function')
        )
          throw new TypeErrorIntrinsic(
            'Locale list entries must be strings or objects'
          )
        // Steps 7.c.iii–iv: Locale tag, otherwise string-hint ToString.
        // Conversion errors propagate; primitive symbols failed the type check.
        // https://tc39.es/ecma262/#sec-tostring
        var tag = localeString(value)
        if (tag === undefined) tag = toString(value)
        // CanonicalizeLocaleList 7.c.v–vi: Rust validates, then canonicalizes.
        var canonical = canonicalTag(tag)
        // CanonicalizeLocaleList 7.c.vii: append only the first canonical tag.
        var duplicate = false
        for (var i = 0; i < result.length; i++) {
          if (result[i] === canonical) {
            duplicate = true
            break
          }
        }
        // Intl.getCanonicalLocales 2: fuse CreateArrayFromList with append.
        // Own data properties bypass push; null-prototype descriptors ignore get/set poisoning.
        // https://tc39.es/ecma262/#sec-createarrayfromlist
        if (!duplicate)
          defineProperty(result, result.length, {
            __proto__: null,
            value: canonical,
            writable: true,
            enumerable: true,
            configurable: true,
          })
      }
      // CanonicalizeLocaleList 8; Intl.getCanonicalLocales 1–2.
      return result
    },
  }.getCanonicalLocales

  defineProperty(getCanonicalLocales, '__localeBrandRegistry', {
    __proto__: null,
    value: registry,
  })
  defineProperty(getCanonicalLocales, '__addLocaleBrandReader', {
    __proto__: null,
    value: addLocaleBrandReader,
  })
  defineProperty(getCanonicalLocales, '__readLocaleTag', {
    __proto__: null,
    value: localeString,
  })
  // ECMA-402 §8.3.1 and ECMA-262 built-in property attributes.
  // https://tc39.es/ecma262/#sec-ecmascript-standard-built-in-objects
  defineProperty(intl, 'getCanonicalLocales', {
    __proto__: null,
    value: getCanonicalLocales,
    writable: true,
    configurable: true,
  })
})
