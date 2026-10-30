let last
for (let index = 0; index < 500000; index++) last = new Intl.PluralRules('en')
if (last.select(1) !== 'one') throw new Error('Plural constructor checksum')
print(last.resolvedOptions().locale)
