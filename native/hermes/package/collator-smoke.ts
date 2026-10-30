export {}
const root = globalThis as any
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
const model = Intl.Collator('en', {numeric: true})
equal(model.compare('item2', 'item10'), -1)
equal(model.compare('x', 'x1'), -1)
equal(model.compare('x1', 'x2'), -1)
if (model.compare !== model.compare) throw new Error('cached compare')
const compare = model.compare
equal(compare.call({}, 'item2', 'item10'), -1)
equal(compare.name, '')
equal(compare.length, 2)
let caught = false
try {
  Reflect.construct(compare, ['a', 'b'])
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('non-constructor compare')
const getter = Object.getOwnPropertyDescriptor(
  Intl.Collator.prototype,
  'compare'
)!.get!
caught = false
try {
  getter.call({})
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('private Collator brand')
equal(new Intl.Collator('de', {usage: 'search'}).compare('AE', 'Ä'), -1)
equal(new Intl.Collator('sv').compare('z', 'å'), -1)
equal(new Intl.Collator('es-u-co-trad').compare('cz', 'ch'), -1)
equal(new Intl.Collator('tr', {sensitivity: 'base'}).compare('I', 'ı'), 0)
for (const sensitivity of ['base', 'accent'] as const)
  equal(
    new Intl.Collator('en', {sensitivity, caseFirst: 'upper'}).compare(
      'a',
      'A'
    ),
    0
  )
const upper = new Intl.Collator('en', {caseFirst: 'upper'})
if (!Object.is(upper.compare('Å', 'A\u030a'), 0))
  throw new Error('canonical positive zero')
equal(upper.compare('å', 'Å'), upper.compare('å', 'A\u030a'))
const thai = new Intl.Collator('th')
equal(thai.resolvedOptions().ignorePunctuation, true)
equal(thai.compare('a-b', 'ab'), 0)
if (thai.compare('a-b', 'cd') === 0)
  throw new Error('letters must not be ignorable')
if (model.compare('\ud800', '\ufffd') === 0)
  throw new Error('preserve lone surrogate')
equal(new Intl.Collator('en-u-co-default').resolvedOptions().locale, 'en')
equal(Intl.Collator.supportedLocalesOf(['zz-ZZ', 'en-US-u-kn']), ['en-US-u-kn'])
root.__SDK_COLLATOR_PASSED = true
