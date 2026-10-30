var model = new Intl.RelativeTimeFormat('en', {numeric: 'always'})
var last
for (var index = 0; index < 150000; index++)
  last = model.formatToParts(-3, 'day')
if (last.length !== 2 || last[0].value !== '3' || last[0].unit !== 'day')
  throw new Error('Unexpected relative parts')
print(last[1].value)
