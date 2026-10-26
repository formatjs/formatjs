// Intl.getCanonicalLocales 1–2 delegates to CanonicalizeLocaleList, then returns an array.
// https://github.com/tc39/ecma402/blob/3691634ebc1794f2af74cb26e59824b21090c3ad/spec/intl.html#L92-L93
// https://github.com/tc39/ecma402/blob/3691634ebc1794f2af74cb26e59824b21090c3ad/spec/negotiation.html#L48-L71
// eslint-disable-next-line no-unused-expressions -- JSI consumes the evaluated factory.
;(function (canonicalize) {
  'use strict'
  var defineProperty = Object.defineProperty
  var toObject = Object
  var toString = String
  var apply = Reflect.apply
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
  var localeToString = intl.Locale && intl.Locale.prototype.toString

  // CanonicalizeLocaleList 3, 7.c.iii–iii.1: the trusted Locale intrinsic
  // supplies its brand and tag without reading overridden instance properties.
  // Capture after trusted Locale installation, before application code.
  function localeString(value) {
    if (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function')
    ) {
      if (localeToString) {
        try {
          return apply(localeToString, value, [])
        } catch {}
      }
    }
    return undefined
  }

  // Method syntax supplies name, length 1, and no [[Construct]] or prototype.
  // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L30318-L30328
  var getCanonicalLocales = {
    getCanonicalLocales(locales) {
      // CanonicalizeLocaleList 1–1.a: omitted input returns an empty list.
      if (locales === undefined) return []
      // CanonicalizeLocaleList 4.a: ToObject rejects null.
      // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L5679-L5701
      if (locales === null)
        throw new TypeErrorIntrinsic('Cannot convert null to an object')
      // CanonicalizeLocaleList 3–4.a: singleton array for a string/Locale tag;
      // otherwise box with ToObject. Array literals create own elements.
      // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L6493-L6511
      var single = localeString(locales)
      var list =
        typeof locales === 'string'
          ? [locales]
          : single !== undefined
            ? [single]
            : toObject(locales)
      // CanonicalizeLocaleList 5: LengthOfArrayLike reads/coerces length once,
      // then ToLength truncates and clamps to 2^53 - 1. Unary + rejects BigInt.
      // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L6513-L6526
      // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L5719-L5734
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
        // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L6360-L6375
        // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L6185-L6201
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
        // Steps 7.c.iii–iv.1: Locale tag, otherwise string-hint ToString.
        // Conversion errors propagate; primitive symbols failed the type check.
        // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L5653-L5677
        var tag = localeString(value)
        if (tag === undefined) tag = toString(value)
        // CanonicalizeLocaleList 7.c.v–vi: Rust validates, then canonicalizes.
        var canonical = canonicalize(tag)
        if (canonical === null)
          throw new RangeErrorIntrinsic('Invalid language tag: ' + tag)
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
        // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L6493-L6511
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

  // Standard method attributes: writable, configurable, non-enumerable.
  // https://github.com/tc39/ecma262/blob/40ce6f206b5669e69bf010a38267ae24a2843404/spec.html#L30329
  defineProperty(intl, 'getCanonicalLocales', {
    __proto__: null,
    value: getCanonicalLocales,
    writable: true,
    configurable: true,
  })
})
