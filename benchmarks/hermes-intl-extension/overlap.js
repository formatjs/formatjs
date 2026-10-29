;(function () {
  function pluralSelection(name, locale, value, options) {
    var rules = new Intl.PluralRules(locale, options)
    return [
      name,
      function () {
        return rules.select(value)
      },
    ]
  }
  var cases = [
    [
      'getCanonicalLocales',
      function () {
        return Intl.getCanonicalLocales('EN-us')[0]
      },
    ],
    [
      'Locale.maximize',
      (function () {
        var x = new Intl.Locale('en')
        return function () {
          return x.maximize().toString()
        }
      })(),
    ],
    pluralSelection('PluralRules.select', 'en', 1),
    pluralSelection('PluralRules.select(decimal)', 'en', 1.25),
    pluralSelection('PluralRules.select(string)', 'en', '1.25'),
    pluralSelection('PluralRules.select(ordinal)', 'en', 21, {type: 'ordinal'}),
    pluralSelection('PluralRules.select(ru)', 'ru', 22),
    [
      'PluralRules.selectRange',
      (function () {
        var rules = new Intl.PluralRules('en')
        return function () {
          return rules.selectRange(1, 2)
        }
      })(),
    ],
    [
      'ListFormat.format',
      (function () {
        var x = new Intl.ListFormat('en')
        var a = ['one', 'two', 'three']
        return function () {
          return x.format(a)
        }
      })(),
    ],
    [
      'ListFormat.formatToParts',
      (function () {
        var x = new Intl.ListFormat('en')
        var a = ['one', 'two', 'three']
        return function () {
          return x.formatToParts(a).length
        }
      })(),
    ],
    [
      'RelativeTimeFormat.format',
      (function () {
        var x = new Intl.RelativeTimeFormat('en', {numeric: 'always'})
        return function () {
          return x.format(-3, 'day')
        }
      })(),
    ],
    [
      'RelativeTimeFormat.formatToParts',
      (function () {
        var x = new Intl.RelativeTimeFormat('en', {numeric: 'always'})
        return function () {
          return x.formatToParts(-3, 'day').length
        }
      })(),
    ],
    [
      'RelativeTimeFormat.format(decimal)',
      (function () {
        var x = new Intl.RelativeTimeFormat('en', {numeric: 'always'})
        return function () {
          return x.format(-1234.5, 'day')
        }
      })(),
    ],
    [
      'RelativeTimeFormat.format(auto)',
      (function () {
        var x = new Intl.RelativeTimeFormat('en', {numeric: 'auto'})
        return function () {
          return x.format(-1, 'day')
        }
      })(),
    ],
  ]
  cases.push([
    'Locale.new',
    function () {
      return new Intl.Locale('en')
    },
  ])
  cases.push([
    'Locale.new(options)',
    function () {
      return new Intl.Locale('en', {region: 'GB'})
    },
  ])
  cases.push([
    'Locale.new(zh-HK)',
    function () {
      return new Intl.Locale('zh-HK')
    },
  ])
  cases.push([
    'Locale.new.language',
    function () {
      return new Intl.Locale('en').language
    },
  ])
  cases.push([
    'Locale.new.toString',
    function () {
      return new Intl.Locale('en').toString()
    },
  ])
  cases.push([
    'Locale.language',
    (function () {
      var locale = new Intl.Locale('en')
      return function () {
        return locale.language
      }
    })(),
  ])
  cases.push([
    'Locale.new(Locale)',
    (function () {
      var locale = new Intl.Locale('en')
      return function () {
        return new Intl.Locale(locale)
      }
    })(),
  ])
  cases.push([
    'Locale.new(diverse)',
    (function () {
      var tags = [],
        index = 0
      for (var i = 0; i < 192; i++) tags.push('en-x-bench-' + i)
      return function () {
        return new Intl.Locale(tags[index++ % tags.length])
      }
    })(),
  ])
  cases.push([
    'Locale.new(long)',
    (function () {
      var tag = 'en-x-abcdefgh'
      for (var i = 0; i < 19; i++) tag += '-abcdefgh'
      return function () {
        return new Intl.Locale(tag)
      }
    })(),
  ])
  cases.push([
    'PluralRules.new',
    function () {
      return new Intl.PluralRules('en')
    },
  ])
  cases.push([
    'PluralRules.new(options)',
    function () {
      return new Intl.PluralRules('en', {
        type: 'ordinal',
        minimumFractionDigits: 2,
      })
    },
  ])
  cases.push([
    'ListFormat.new',
    function () {
      return new Intl.ListFormat('en')
    },
  ])
  cases.push([
    'ListFormat.new(fallback)',
    function () {
      return new Intl.ListFormat('en-XX')
    },
  ])
  cases.push([
    'ListFormat.new(unsupported)',
    function () {
      return new Intl.ListFormat('qzz')
    },
  ])
  cases.push([
    'RelativeTimeFormat.new',
    function () {
      return new Intl.RelativeTimeFormat('en', {numeric: 'always'})
    },
  ])
  cases.push([
    'RelativeTimeFormat.new(fallback)',
    function () {
      return new Intl.RelativeTimeFormat('en-XX', {numeric: 'always'})
    },
  ])
  var now = typeof __now === 'function' ? __now : Date.now
  var sink = ''
  function run(f, n) {
    var begin = now()
    for (var i = 0; i < n; i++) sink = f()
    return now() - begin
  }
  function median(a) {
    a.sort(function (x, y) {
      return x - y
    })
    return a[(a.length / 2) | 0]
  }
  for (var c = 0; c < cases.length; c++) {
    var name = cases[c][0],
      f = cases[c][1]
    var value = f()
    if (name.indexOf('PluralRules.new') === 0) value = value.select(1)
    if (name.indexOf('Locale.new') === 0) value = value.toString()
    if (
      name.indexOf('ListFormat.new') === 0 ||
      name.indexOf('RelativeTimeFormat.new') === 0
    )
      value = value.resolvedOptions().locale
    var n = 1
    while (n < 10000000 && run(f, n) < 50) n *= 2
    var samples = []
    for (var r = 0; r < 7; r++) samples.push((run(f, n) * 1000) / n)
    print(
      JSON.stringify({
        name: name,
        us: median(samples),
        iterations: n,
        value: value,
      })
    )
  }
  if (sink === undefined) throw new Error('unused result')
})()
