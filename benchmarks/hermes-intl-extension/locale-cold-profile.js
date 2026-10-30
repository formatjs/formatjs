var tags = []
for (var i = 0; i < 192; i++) tags.push('en-x-bench-' + i)
var last
for (var index = 0; index < 300000; index++)
  last = new Intl.Locale(tags[index % tags.length])
if (last.toString() !== tags[299999 % tags.length])
  throw new Error('Unexpected Locale tag')
print(last.toString())
