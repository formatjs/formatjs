let last
for (let index = 0; index < 200000; index++)
  last = new Intl.PluralRules('en', {type: 'ordinal', minimumFractionDigits: 2})
const options = last.resolvedOptions()
if (
  options.type !== 'ordinal' ||
  options.minimumFractionDigits !== 2 ||
  last.select(21) !== 'one'
)
  throw new Error('Plural options checksum')
print(options.locale)
