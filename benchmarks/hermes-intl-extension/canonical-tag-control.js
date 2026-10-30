;(function () {
  var diverse = []
  for (var index = 0; index < 160; index++) diverse.push('en-x-n' + index)
  var cursor = 0
  var longTag = 'en-x-' + 'abcdefgh-'.repeat(20) + 'abcdefgh'
  var cases = [
    [
      'repeated',
      function () {
        return Intl.getCanonicalLocales('EN-us')[0]
      },
      'en-US',
    ],
    [
      'diverse',
      function () {
        var tag = diverse[cursor]
        cursor = (cursor + 1) % diverse.length
        return Intl.getCanonicalLocales(tag)[0]
      },
      'en-x-n0',
    ],
    [
      'long',
      function () {
        return Intl.getCanonicalLocales(longTag)[0]
      },
      longTag,
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
    var value = f()
    if (value !== cases[c][2])
      throw new Error('Unexpected canonical tag: ' + name)
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
