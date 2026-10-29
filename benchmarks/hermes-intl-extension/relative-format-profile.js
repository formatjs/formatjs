var model = new Intl.RelativeTimeFormat('en', {numeric: 'always'})
var last
for (var index = 0; index < 250000; index++) last = model.format(-3, 'day')
if (last !== '3 days ago') throw new Error('Unexpected relative formatting')
print(last)
