export {}

const root = globalThis as any
const ListFormat = Intl.ListFormat
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
equal(ListFormat.supportedLocalesOf(['en', 'fr']), ['en', 'fr'])
const english = new ListFormat('en')
equal(english.format(['A', 'B', 'C']), 'A, B, and C')
equal(english.formatToParts(['\ud800', '\udc00']), [
  {type: 'element', value: '\ud800'},
  {type: 'literal', value: ' and '},
  {type: 'element', value: '\udc00'},
])
equal(english.format('😀A'), '😀 and A')
equal(ListFormat.supportedLocalesOf('fr'), ['fr'])
equal(new ListFormat('fr').format(['A', 'B']), 'A et B')
equal(english.format(['A', 'B']), 'A and B')
equal(ListFormat.supportedLocalesOf(['fr-FR-u-nu-arab']), ['fr-FR-u-nu-arab'])
let closed = false,
  caught = false
const invalid = {
  [Symbol.iterator]() {
    return {
      next() {
        return {done: false, value: 1}
      },
      return() {
        closed = true
        return {}
      },
    }
  },
}
try {
  english.format(invalid as any)
} catch (error) {
  caught = error instanceof TypeError
}
equal([closed, caught], [true, true])
let badReceiver = false
try {
  ListFormat.prototype.format.call({}, ['A'])
} catch (error) {
  badReceiver = error instanceof TypeError
}
equal(badReceiver, true)
root.__SDK_LIST_PASSED = true
