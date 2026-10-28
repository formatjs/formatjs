;(function () {
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
    [
      'PluralRules.select',
      (function () {
        var x = new Intl.PluralRules('en')
        return function () {
          return x.select(1)
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
    'PluralRules.new',
    function () {
      return new Intl.PluralRules('en')
    },
  ])
  cases.push([
    'ListFormat.new',
    function () {
      return new Intl.ListFormat('en')
    },
  ])
  cases.push([
    'RelativeTimeFormat.new',
    function () {
      return new Intl.RelativeTimeFormat('en', {numeric: 'always'})
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
    var n = 100
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
