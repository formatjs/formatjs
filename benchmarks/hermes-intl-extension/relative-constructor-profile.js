var last
for (var index = 0; index < 50000; index++)
  last = new Intl.RelativeTimeFormat('en', {numeric: 'always'})
if (last.format(-3, 'day') !== '3 days ago')
  throw new Error('Unexpected relative formatting')
print(last.resolvedOptions().locale)
