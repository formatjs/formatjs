// Algorithm/step mapping: ../../crates/intl_getcanonicallocales/SPEC.md.
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

  // CanonicalizeLocaleList 3 and 7.c.iii: probe Locale internal slots through
  // the captured intrinsic, without reading overridden instance properties.
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

  // Method syntax keeps the public function non-constructible.
  var getCanonicalLocales = {
    getCanonicalLocales(locales) {
      // CanonicalizeLocaleList 1–1.a: omitted input returns an empty list.
      if (locales === undefined) return []
      // CanonicalizeLocaleList 4.a: ToObject rejects null.
      if (locales === null)
        throw new TypeErrorIntrinsic('Cannot convert null to an object')
      // CanonicalizeLocaleList 3–4: wrap a string/Locale; otherwise ToObject.
      var single = localeString(locales)
      var list =
        typeof locales === 'string'
          ? [locales]
          : single !== undefined
            ? [single]
            : toObject(locales)
      // CanonicalizeLocaleList 5: LengthOfArrayLike reads/coerces length once,
      // then ToLength truncates and clamps to 2^53 - 1.
      var length = +list.length
      var len =
        length !== length || length <= 0
          ? 0
          : length > 9007199254740991
            ? 9007199254740991
            : floor(length)
      // CanonicalizeLocaleList 2, 6: initialize seen and its iteration index.
      var result = []
      for (var k = 0; k < len; k++) {
        // CanonicalizeLocaleList 7.a–c.i: ToString(k), HasProperty, then Get.
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
        // CanonicalizeLocaleList 7.c.iii–iv: Locale slot, otherwise ToString.
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
        // Intl.getCanonicalLocales 2: CreateArrayFromList uses own data properties.
        // Null-prototype descriptors prevent inherited getters/setters changing them.
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

  defineProperty(intl, 'getCanonicalLocales', {
    __proto__: null,
    value: getCanonicalLocales,
    writable: true,
    configurable: true,
  })
})
