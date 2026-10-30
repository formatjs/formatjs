export {}
const root = globalThis as any
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(JSON.stringify({actual, expected}))
}
const segmenter = new Intl.Segmenter('en')
const input = 'á😀b'
const segments = segmenter.segment(input)
equal(Array.from(segments), [
  {segment: 'á', index: 0, input},
  {segment: '😀', index: 2, input},
  {segment: 'b', index: 4, input},
])
equal(segments.containing(3), {segment: '😀', index: 2, input})
equal(segments.containing(-0.5), segments.containing(0))
equal(segments.containing(input.length), undefined)
const first = segments[Symbol.iterator](),
  second = segments[Symbol.iterator]()
equal(first.next(), second.next())
first.next()
equal(second.next().value?.index, 2)
if (first[Symbol.iterator]() !== first) throw new Error('iterator identity')
const raw = '\ud800a\udc00'
equal(Array.from(segmenter.segment(raw), part => part.segment).join(''), raw)
const words = new Intl.Segmenter('en', {granularity: 'word'})
equal(
  Array.from(words.segment('こんにちは世界'), part => part.segment),
  ['こんにちは', '世界']
)
equal(
  Array.from(words.segment('ทุกสองสัปดาห์'), part => part.segment),
  ['ทุก', 'สอง', 'สัปดาห์']
)
equal(
  Array.from(words.segment('नमस्ते दुनिया।'), part => part.isWordLike),
  [true, false, true, false]
)
equal(Intl.Segmenter.supportedLocalesOf(['zz-ZZ', 'fr-FR-u-nu-arab']), [
  'fr-FR-u-nu-arab',
])
let caught = false
try {
  Intl.Segmenter.prototype.segment.call({} as Intl.Segmenter, 'x')
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('Segmenter brand')
caught = false
try {
  segments.containing(1n as unknown as number)
} catch (error) {
  caught = error instanceof TypeError
}
if (!caught) throw new Error('ToNumber BigInt')
equal(
  Object.prototype.toString.call(first),
  '[object Segmenter String Iterator]'
)
root.__SDK_SEGMENTER_PASSED = true
