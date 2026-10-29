// RUN: %hermes %s | %FileCheck %s --match-full-lines

var loadUnits = Intl.NumberFormat.__addUnitData
print(Intl.getCanonicalLocales('en-us')[0])
// CHECK: en-US
print(Intl.supportedValuesOf('calendar').includes('gregory'))
// CHECK: true
print(new Intl.Locale('en-US').language)
// CHECK: en
if (!new Intl.Locale('de').getCollations().includes('phonebk'))
  throw new Error('Locale must enumerate installed Collator types')
print('phonebk')
// CHECK: phonebk
print(new Intl.PluralRules('en').select(1))
// CHECK: one
print(new Intl.ListFormat('en').format(['A', 'B']))
// CHECK: A and B
print(new Intl.DisplayNames('en', {type: 'language'}).of('fr'))
// CHECK: French
print(
  [...new Intl.Segmenter('en', {granularity: 'grapheme'}).segment('A🙂')].length
)
// CHECK: 2
print(new Intl.Collator('en').compare('a', 'b') < 0)
// CHECK: true
print(new Intl.NumberFormat('en-US').format(1234.5))
// CHECK: 1,234.5
print(new Intl.RelativeTimeFormat('en', {numeric: 'auto'}).format(-1, 'day'))
// CHECK: yesterday
print(
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date('2024-01-02T00:00:00Z'))
)
// CHECK: 01/02/2024
print(
  new Intl.DurationFormat('en', {style: 'digital'}).format({
    hours: 1,
    minutes: 2,
    seconds: 3,
  })
)
// CHECK: 1:02:03

var resolved = Object.getOwnPropertyDescriptor(
  Intl.NumberFormat.prototype,
  'resolvedOptions'
)
var probes = 0
Object.defineProperty(Intl.NumberFormat.prototype, 'resolvedOptions', {
  configurable: true,
  value: function () {
    probes++
    return resolved.value.call(this)
  },
})
Intl.supportedValuesOf('unit')
var first = probes
Intl.supportedValuesOf('unit')
if (probes !== first)
  throw new Error('Supported values must reuse observations')
loadUnits('en', '{"simple":{},"compound":{}}')
Intl.supportedValuesOf('unit')
if (probes <= first)
  throw new Error('Retained loader must invalidate supported values')
Object.defineProperty(Intl.NumberFormat.prototype, 'resolvedOptions', resolved)
print('cache refreshed')
// CHECK: cache refreshed
