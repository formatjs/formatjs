;(function () {
  var existing = new Intl.Locale('en')
  var cases = [
    [
      'Locale.new',
      function () {
        return new Intl.Locale('en')
      },
    ],
    [
      'Locale.new(options)',
      function () {
        return new Intl.Locale('en', {region: 'GB'})
      },
    ],
    [
      'Locale.new(Locale)',
      function () {
        return new Intl.Locale(existing)
      },
    ],
  ]
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
    var value = f().toString()
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
