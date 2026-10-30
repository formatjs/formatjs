// Match constructor benchmarks, which observe one model before timing.
new Intl.Locale('en').toString()
var last
for (var index = 0; index < 1000000; index++) last = new Intl.Locale('en')
if (last.toString() !== 'en') throw new Error('Unexpected Locale tag')
print(last.toString())
