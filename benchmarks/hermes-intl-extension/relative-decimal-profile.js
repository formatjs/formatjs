var model = new Intl.RelativeTimeFormat('en', {numeric: 'always'})
var last
for (var index = 0; index < 500000; index++) last = model.format(-1234.5, 'day')
if (last !== '1,234.5 days ago')
  throw new Error('Unexpected relative formatting')
print(last)
