/**
 * Benchmark for the JavaScript/TypeScript ICU MessageFormat parser.
 *
 * Run with: `bazel run //packages/icu-messageformat-parser/benchmark:benchmark`
 *
 * Append `-- --fallback` to measure the Unicode-property fallback.
 *
 * Results: The JavaScript parser is fast, but the Rust parser (optimized build)
 * is 2.3-3.5x faster on this corpus. See
 * crates/icu_messageformat_parser/BENCHMARK.md for detailed comparison.
 */
import {Bench} from 'tinybench'
const NativeRegExp = globalThis.RegExp
let rejectedPropertyRegexes = 0
if (process.argv.includes('--fallback')) {
  globalThis.RegExp = new Proxy(NativeRegExp, {
    construct(target, args) {
      if (String(args[0]).includes('\\p{')) {
        rejectedPropertyRegexes++
        throw new SyntaxError('Unicode property escapes unavailable')
      }
      return Reflect.construct(target, args)
    },
  })
}
const {parse} = await (async () => {
  try {
    return await import('@formatjs/icu-messageformat-parser')
  } finally {
    globalThis.RegExp = NativeRegExp
  }
})()
if (process.argv.includes('--fallback') && rejectedPropertyRegexes === 0) {
  throw new Error('Benchmark did not exercise the Unicode-property fallback')
}

const complexMsg =
  '' +
  '{gender_of_host, select, ' +
  'female {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites <em>{guest}</em> to her party.}' +
  '=2 {{host} invites <em>{guest}</em> and <em>one</em> other person to her party.}' +
  'other {{host} invites <em>{guest}</em> and <em>#</em> other people to her party.}}}' +
  'male {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites <em>{guest}</em> to his party.}' +
  '=2 {{host} invites <em>{guest}</em> and one other person to his party.}' +
  'other {{host} invites <em>{guest}</em> and <em>#</em> other people to his party.}}}' +
  'other {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites <em>{guest}</em> to their party.}' +
  '=2 {{host} invites <em>{guest}</em> and one other person to their party.}' +
  'other {{host} invites <em>{guest}</em> and <em>#</em> other people to their party.}}}}'

const normalMsg =
  '' +
  'Yo, {firstName} {lastName} has ' +
  '{numBooks, number, integer} ' +
  '{numBooks, plural, ' +
  'one {book} ' +
  'other {books}}.'

const simpleMsg = 'Hello, {name}!'

const stringMsg = 'Hello, world!'
const unicodeMsg =
  '你好，{姓名}！{数量, plural, one {{𐐀} 📚} other {{имя} # 📚}}'

console.log('complex_msg AST length', JSON.stringify(parse(complexMsg)).length)
console.log('normal_msg AST length', JSON.stringify(parse(normalMsg)).length)
console.log('simple_msg AST length', JSON.stringify(parse(simpleMsg)).length)
console.log('string_msg AST length', JSON.stringify(parse(stringMsg)).length)

async function run() {
  const bench = new Bench({time: 1000})

  bench
    .add('complex_msg', () => parse(complexMsg))
    .add('normal_msg', () => parse(normalMsg))
    .add('simple_msg', () => parse(simpleMsg))
    .add('string_msg', () => parse(stringMsg))
    .add('unicode_msg', () => parse(unicodeMsg))

  await bench.run()

  console.table(bench.table())
}

run()
