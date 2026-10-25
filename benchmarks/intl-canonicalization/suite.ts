import {getCanonicalLocales as polyfill} from '#packages/intl-getcanonicallocales/index.js'

declare function print(message: string): void
declare const FORMATJS_CANONICAL_TEST_ONLY: boolean

type Canonicalizer = (input?: any) => string[]
const rust: Canonicalizer = Intl.getCanonicalLocales
if (typeof rust !== 'function') throw new Error('Rust JSI method missing')

const tags: [string, string][] = [
  ['en', 'en'],
  ['posix', 'posix'],
  ['german', 'german'],
  ['GERMAN', 'german'],
  ['abcde-Latn-BU', 'abcde-Latn-MM'],
  ['abcde-Armn-SU', 'abcde-Armn-RU'],
  ['en-t-posix', 'en-t-posix'],
  ['en-t-posix-m0-true', 'en-t-posix-m0-true'],
  ['en-t-GERMAN-latn-bu', 'en-t-german-latn-mm'],
  ['DE-de', 'de-DE'],
  ['zh-hANs-sG', 'zh-Hans-SG'],
  ['iw-IL', 'he-IL'],
  ['in-ID', 'id-ID'],
  ['ji', 'yi'],
  ['twi', 'ak'],
  ['CMN-hANS', 'zh-Hans'],
  ['SGN-gr', 'gss'],
  ['SL-ROZAJ-BISKE', 'sl-biske-rozaj'],
  ['und-Armn-SU', 'und-Armn-AM'],
  ['art-lojban', 'jbo'],
  ['jbo-lojban', 'jbo'],
  ['hy-arevela', 'hy'],
  ['hy-arevmda', 'hyw'],
  ['hye-arevmda', 'hyw'],
  ['ja-Latn-fonipa-hepburn-heploc', 'ja-Latn-alalc97-fonipa'],
  ['en-aaland', 'en-AX'],
  ['en-GB-aaland', 'en-GB'],
  ['en-u-ca-islamicc', 'en-u-ca-islamic-civil'],
  ['en-u-ms-imperial', 'en-u-ms-uksystem'],
  ['en-u-kn-yes', 'en-u-kn'],
  ['en-u-KN-TRUE-kn-false', 'en-u-kn'],
  ['en-u-ks-primary', 'en-u-ks-level1'],
  [
    'en-u-foo-bar-nu-thai-ca-buddhist-kk-true',
    'en-u-bar-foo-ca-buddhist-kk-nu-thai',
  ],
  ['en-t-EN-Latn-CA', 'en-t-en-latn-ca'],
  ['en-t-d0-ascii', 'en-t-d0-ascii'],
  ['en-t-en-i0-handwrit', 'en-t-en-i0-handwrit'],
  ['en-t-m0-true', 'en-t-m0-true'],
  ['en-u-xx-true-foo', 'en-u-xx-true-foo'],
  ['en-t-m0-true-foo', 'en-t-m0-true-foo'],
  ['en-t-m0-ungegn-m0-alaloc', 'en-t-m0-ungegn'],
  ['und-Latn-t-und-hani-m0-names', 'und-Latn-t-und-hani-m0-prprname'],
  ['und-u-rg-no23', 'und-u-rg-no50'],
  ['und-NO-u-sd-no23', 'und-NO-u-sd-no50'],
  ['und-u-rg-lud', 'und-u-rg-lucl'],
  ['und-u-rg-fi01', 'und-u-rg-axzzzz'],
  ['und-AX-u-sd-fi01', 'und-AX-u-sd-axzzzz'],
  ['en-u-rg-uszzzz', 'en-u-rg-uszzzz'],
  ['und-x-private', 'und-x-private'],
  ['en-A-FOO-x-PRIVATE', 'en-a-foo-x-private'],
]

const invalid = [
  '',
  'a',
  'abcd',
  'i-klingon',
  'en_US',
  'en--US',
  '-en',
  'en-',
  'en\n',
  'en-ü',
  'en-a',
  'en-t',
  'en-t-d0',
  'en-t-en-0',
  'de-gregory-gregory',
  'en-a-foo-A-bar',
  'en-u-ca-gregory-U-nu-latn',
]

let assertions = 0
const failures: string[] = []
function equal(actual: unknown, expected: unknown, label: string): void {
  assertions++
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures[failures.length] =
      `${label}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`
  }
}

function throws(run: () => unknown, kind: string, label: string): void {
  assertions++
  let actual: unknown
  try {
    actual = run()
  } catch (error) {
    if (error instanceof Error && error.name === kind) return
    failures[failures.length] =
      `${label}: expected ${kind}, received ${String(error)}`
    return
  }
  failures[failures.length] =
    `${label}: expected ${kind}, returned ${JSON.stringify(actual)}`
}

function outcome(
  method: Canonicalizer,
  input: any
): string[] | {error: string} {
  try {
    return method(input)
  } catch (error) {
    return {error: error instanceof Error ? error.name : String(error)}
  }
}

function check(method: Canonicalizer, name: string): void {
  for (const [input, expected] of tags)
    equal(outcome(method, input), [expected], `${name} ${input}`)
  for (const input of invalid)
    throws(() => method(input), 'RangeError', `${name} ${input}`)
  equal(method(), [], `${name} omitted`)
  equal(
    method(['iw', 'he', 'EN-us', 'en-US', 'fr']),
    ['he', 'en-US', 'fr'],
    `${name} dedup`
  )
  equal(
    method({0: 'DE-de', 2: 'fr', length: 3}),
    ['de-DE', 'fr'],
    `${name} holes`
  )
  equal(method({0: 'en', length: '1.9'}), ['en'], `${name} ToLength`)
  for (const input of [
    null,
    [null],
    [42],
    [true],
    [Symbol('locale')],
    {length: 1n},
  ]) {
    throws(() => method(input), 'TypeError', `${name} invalid type`)
  }
  const reads: string[] = []
  const list = new Proxy(
    {0: 'en', length: 1},
    {
      get(target, key) {
        reads[reads.length] = `get:${String(key)}`
        return Reflect.get(target, key)
      },
      has(target, key) {
        reads[reads.length] = `has:${String(key)}`
        return Reflect.has(target, key)
      },
    }
  )
  equal(method(list), ['en'], `${name} proxy`)
  equal(reads, ['get:length', 'has:0', 'get:0'], `${name} observable order`)
  const hints: string[] = []
  equal(
    method([
      {
        [Symbol.toPrimitive](hint: string) {
          hints[hints.length] = hint
          return 'fr'
        },
      },
    ]),
    ['fr'],
    `${name} coercion`
  )
  equal(hints, ['string'], `${name} string hint`)
  const originalPush = Array.prototype.push
  let result: string[]
  try {
    Array.prototype.push = () => {
      throw new Error('observable push')
    }
    result = method(['en-u-kn-yes', 'SL-BISKE-ROZAJ'])
  } finally {
    Array.prototype.push = originalPush
  }
  equal(result!, ['en-u-kn', 'sl-biske-rozaj'], `${name} push override`)
  if (typeof Intl.Locale === 'function') {
    const locale = new Intl.Locale('en-US')
    Object.defineProperty(locale, 'toString', {
      value() {
        throw new Error('own toString')
      },
    })
    equal(method(locale), ['en-US'], `${name} Locale singleton`)
    equal(method([locale]), ['en-US'], `${name} Locale entry`)
  }
}

check(rust, 'rust-jsi')
check(polyfill as Canonicalizer, 'js-polyfill')
throws(() => rust('root'), 'RangeError', 'rust-jsi root')
equal(polyfill('root'), ['root'], 'js-polyfill known root acceptance')
let generatedTags = 0
let territoryBaselineDifferences = 0
for (const language of ['en', 'sh', 'hye', 'und', 'posix', 'abcde']) {
  for (const script of ['', '-Latn', '-Armn']) {
    for (const region of ['', '-BU', '-SU', '-GB']) {
      for (const variant of ['', '-arevmda', '-aaland', '-hepburn-heploc']) {
        for (const extension of [
          '',
          '-u-ca-islamicc-kn-yes',
          '-t-en-m0-names',
          '-a-foo-x-private',
        ]) {
          const tag = language + script + region + variant + extension
          const nativeResult = outcome(rust, tag)
          const polyfillResult = outcome(polyfill as Canonicalizer, tag)
          generatedTags++
          if (language === 'hye' && script !== '' && region === '-SU') {
            const canonicalLanguage = variant === '-arevmda' ? 'hyw' : 'hy'
            const canonicalVariant =
              variant === '-hepburn-heploc' ? '-alalc97' : ''
            const canonicalExtension =
              extension === '-u-ca-islamicc-kn-yes'
                ? '-u-ca-islamic-civil-kn'
                : extension === '-t-en-m0-names'
                  ? '-t-en-m0-prprname'
                  : extension
            const prefix = canonicalLanguage + script
            const suffix = canonicalVariant + canonicalExtension
            equal(
              nativeResult,
              [prefix + '-AM' + suffix],
              `rust-jsi known territory ${tag}`
            )
            equal(
              polyfillResult,
              [prefix + '-RU' + suffix],
              `js-polyfill known territory ${tag}`
            )
            territoryBaselineDifferences++
          } else {
            equal(nativeResult, polyfillResult, `generated ${tag}`)
          }
          if (!Array.isArray(nativeResult) || !Array.isArray(polyfillResult)) {
            failures[failures.length] = `valid generated tag rejected: ${tag}`
          }
        }
      }
    }
  }
}
if (failures.length) throw new Error(failures.join('\n'))
print(
  JSON.stringify({
    type: 'correctness',
    assertions,
    tags: tags.length,
    invalid: invalid.length,
    generatedTags,
    knownBaselineDifferences: [
      {input: 'root', rust: 'RangeError', polyfill: ['root']},
      {
        input: 'hye-{Latn,Armn}-SU with variants/extensions',
        cases: territoryBaselineDifferences,
        rustTerritory: 'AM',
        polyfillTerritory: 'RU',
      },
    ],
  })
)

if (!FORMATJS_CANONICAL_TEST_ONLY) {
  const workloads: {name: string; inputs: any[]}[] = [
    {name: 'language', inputs: ['en', 'fr', 'de', 'ja', 'ar', 'zh']},
    {
      name: 'aliases',
      inputs: [
        'iw-IL',
        'CMN-hANS',
        'und-Armn-SU',
        'ja-Latn-hepburn-heploc',
        'en-u-ca-islamicc',
      ],
    },
    {
      name: 'extensions',
      inputs: [
        'en-u-foo-bar-nu-thai-ca-buddhist-kk-true',
        'en-t-en-latn-ca',
        'und-Latn-t-und-hani-m0-names',
        'en-a-foo-x-private',
      ],
    },
    {
      name: 'locale-list',
      inputs: [
        ['iw', 'he', 'EN-us', 'en-US', 'fr'],
        ['DE-de', 'zh-hANs-sG', 'und', 'SL-BISKE-ROZAJ'],
      ],
    },
  ]
  let checksum = 0
  function exercise(method: Canonicalizer, inputs: any[], calls: number): void {
    let sum = 0
    for (let index = 0; index < calls; index++) {
      const output = method(inputs[index % inputs.length])
      sum =
        (sum + output.length + output[0].length + output[0].charCodeAt(0)) | 0
    }
    checksum = (checksum + sum) | 0
  }
  function median(values: number[]): number {
    const sorted = values.slice().sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
  }
  for (const workload of workloads) {
    for (const input of workload.inputs)
      equal(rust(input), polyfill(input), `timed ${workload.name}`)
    if (failures.length) throw new Error(failures.join('\n'))
    exercise(rust, workload.inputs, 1000)
    exercise(polyfill as Canonicalizer, workload.inputs, 1000)
    let calls = 100
    for (;;) {
      const start = performance.now()
      exercise(polyfill as Canonicalizer, workload.inputs, calls)
      if (performance.now() - start >= 100 || calls >= 1000000) break
      calls *= 2
    }
    const rustSamples: number[] = []
    const polyfillSamples: number[] = []
    for (let round = 0; round < 9; round++) {
      const methods: [Canonicalizer, number[]][] =
        round % 2
          ? [
              [polyfill as Canonicalizer, polyfillSamples],
              [rust, rustSamples],
            ]
          : [
              [rust, rustSamples],
              [polyfill as Canonicalizer, polyfillSamples],
            ]
      for (const [method, samples] of methods) {
        const start = performance.now()
        exercise(method, workload.inputs, calls)
        samples[samples.length] =
          ((performance.now() - start) * 1000000) / calls
      }
    }
    print(
      JSON.stringify({
        type: 'benchmark',
        workload: workload.name,
        callsPerRound: calls,
        rounds: 9,
        rustMedianNs: median(rustSamples),
        polyfillMedianNs: median(polyfillSamples),
        speedup: median(polyfillSamples) / median(rustSamples),
        rustSamplesNs: rustSamples,
        polyfillSamplesNs: polyfillSamples,
      })
    )
  }
  print(JSON.stringify({type: 'checksum', value: checksum}))
}
