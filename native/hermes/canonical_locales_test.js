;(function () {
  var canonicalize = Intl.getCanonicalLocales
  var count = 0
  function equal(actual, expected) {
    count++
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(
        JSON.stringify(actual) + ' != ' + JSON.stringify(expected)
      )
  }
  function throws(type, callback) {
    count++
    try {
      callback()
    } catch (error) {
      if (error instanceof type) return
      throw error
    }
    throw new Error('Expected ' + type.name)
  }

  equal(canonicalize(), [])
  equal(canonicalize('EN-us'), ['en-US'])
  equal(canonicalize(['iw', 'he', 'in', 'ji']), ['he', 'id', 'yi'])
  equal(canonicalize(['zh-hant-tw', 'en-u-nu-latn-ca-gregory']), [
    'zh-Hant-TW',
    'en-u-ca-gregory-nu-latn',
  ])
  equal(canonicalize({0: 'en', 2: 'fr', length: 3.9}), ['en', 'fr'])
  equal(canonicalize(Object.create({0: 'iw', length: 1})), ['he'])
  equal(canonicalize(12), [])
  equal(
    canonicalize([
      {
        toString: function () {
          return 'EN'
        },
      },
    ]),
    ['en']
  )
  throws(TypeError, function () {
    canonicalize(null)
  })
  throws(TypeError, function () {
    canonicalize([null])
  })
  throws(TypeError, function () {
    canonicalize([1])
  })
  throws(TypeError, function () {
    canonicalize([Symbol()])
  })
  throws(TypeError, function () {
    canonicalize({length: 1n})
  })
  throws(TypeError, function () {
    new canonicalize()
  })
  ;[
    '',
    'en_US',
    'x-private',
    'i-klingon',
    'root',
    'en-u',
    'en-a-foo-A-bar',
    'de-1996-1996',
  ].forEach(function (tag) {
    throws(RangeError, function () {
      canonicalize(tag)
    })
  })
  var reads = 0
  var list = {
    0: 'en',
    get length() {
      reads++
      return {
        valueOf: function () {
          reads++
          return 1
        },
      }
    },
  }
  equal(canonicalize(list), ['en'])
  equal(reads, 2)
  var order = []
  var proxy = new Proxy(
    {length: 1, 0: 'en'},
    {
      get: function (target, key) {
        order.push('get:' + key)
        return target[key]
      },
      has: function (target, key) {
        order.push('has:' + key)
        return key in target
      },
    }
  )
  equal(canonicalize(proxy), ['en'])
  equal(order, ['get:length', 'has:0', 'get:0'])
  var push = Array.prototype.push
  Array.prototype.push = function () {
    throw new Error('push called')
  }
  try {
    equal(canonicalize(['iw', 'he']), ['he'])
  } finally {
    Array.prototype.push = push
  }
  for (var field of ['get', 'set']) {
    var previous = Object.getOwnPropertyDescriptor(Object.prototype, field)
    Object.defineProperty(Object.prototype, field, {
      __proto__: null,
      configurable: true,
      get: function () {
        throw new Error('Descriptor prototype getter called')
      },
    })
    try {
      equal(canonicalize(['EN', 'en', 'FR']), ['en', 'fr'])
    } finally {
      delete Object.prototype[field]
      if (previous) Object.defineProperty(Object.prototype, field, previous)
    }
  }
  var descriptor = Object.getOwnPropertyDescriptor(Intl, 'getCanonicalLocales')
  equal(
    [descriptor.enumerable, descriptor.writable, descriptor.configurable],
    [false, true, true]
  )
  equal([canonicalize.name, canonicalize.length], ['getCanonicalLocales', 1])
  var localeDescriptor = Object.getOwnPropertyDescriptor(Intl, 'Locale')
  Object.defineProperty(Intl, 'Locale', {
    configurable: true,
    get: function () {
      throw new Error('Locale getter called')
    },
  })
  try {
    equal(
      canonicalize([
        {
          toString: function () {
            return 'EN'
          },
        },
      ]),
      ['en']
    )
  } finally {
    if (localeDescriptor)
      Object.defineProperty(Intl, 'Locale', localeDescriptor)
    else delete Intl.Locale
  }
  if (Intl.Locale) {
    var locale = new Intl.Locale('EN')
    locale.toString = function () {
      throw new Error('own toString called')
    }
    equal(canonicalize(locale), ['en'])
    var intrinsic = Intl.Locale.prototype.toString
    Intl.Locale.prototype.toString = function () {
      throw new Error('replacement toString called')
    }
    try {
      equal(canonicalize(locale), ['en'])
    } finally {
      Intl.Locale.prototype.toString = intrinsic
    }
  }
  print('Hermes getCanonicalLocales: ' + count + ' checks passed')
})()
