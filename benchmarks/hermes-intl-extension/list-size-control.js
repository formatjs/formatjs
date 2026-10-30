;(function () {
  var cases = []
  var formatter = new Intl.ListFormat('en')
  for (var size of [0, 1, 3, 32, 256]) {
    cases.push(
      (function (size) {
        var values = []
        for (var index = 0; index < size; index++) values.push('item' + index)
        return [
          'ListFormat.format(size=' + size + ')',
          function () {
            return formatter.format(values)
          },
        ]
      })(size)
    )
  }
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
