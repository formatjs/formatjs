const rules = new Intl.PluralRules('en')
let other = 0
for (let index = 0; index < 1000000; index++) {
  if (rules.selectRange(index % 7, (index % 7) + 1) === 'other') other++
}
if (other !== 1000000) throw Error('Plural range checksum: ' + other)
print(other)
