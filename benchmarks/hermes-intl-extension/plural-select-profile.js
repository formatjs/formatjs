const rules = new Intl.PluralRules('en')
let one = 0
for (let index = 0; index < 10000000; index++) {
  if (rules.select(index % 7) === 'one') one++
}
if (one !== 1428572) throw new Error('Plural checksum: ' + one)
print(one)
