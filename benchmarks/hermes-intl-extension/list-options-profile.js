var last
for (var index = 0; index < 200000; index++)
  last = new Intl.ListFormat('en', {})
if (last.resolvedOptions().locale !== 'en')
  throw new Error('Unexpected matched locale')
print(last.resolvedOptions().locale)
