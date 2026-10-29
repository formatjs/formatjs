var last
for (var index = 0; index < 50000; index++) last = new Intl.ListFormat('en-XX')
if (last.resolvedOptions().locale !== 'en')
  throw new Error('Unexpected matched locale')
print(last.resolvedOptions().locale)
