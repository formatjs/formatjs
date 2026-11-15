import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {performance} from 'node:perf_hooks'
import {pathToFileURL} from 'node:url'
import {gzipSync} from 'node:zlib'
import {transformSync} from 'esbuild'

const resolve = (file: string) =>
  runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/benchmarks/temporal/${file}`
  )
const {Instant} = await import(pathToFileURL(resolve('instant-code.js')).href)
const {Temporal: reference} = await import(
  pathToFileURL(resolve('reference-bundle.js')).href
)
const inputs = [-1000001n, -1n, 0n, 1n, 123456789n, 8640000000000000000000n]
const pairs: [string, (i: number) => bigint, (i: number) => bigint][] = [
  [
    'construct/get epochNanoseconds',
    i => new Instant(inputs[i % inputs.length]).epochNanoseconds,
    i => new reference.Instant(inputs[i % inputs.length]).epochNanoseconds,
  ],
  [
    'fromEpochNanoseconds/get epochMilliseconds',
    i =>
      BigInt(
        Instant.fromEpochNanoseconds(inputs[i % inputs.length])
          .epochMilliseconds
      ),
    i =>
      BigInt(
        reference.Instant.fromEpochNanoseconds(inputs[i % inputs.length])
          .epochMilliseconds
      ),
  ],
  [
    'fromEpochMilliseconds/get epochNanoseconds',
    i => Instant.fromEpochMilliseconds((i % 10001) - 5000).epochNanoseconds,
    i =>
      reference.Instant.fromEpochMilliseconds((i % 10001) - 5000)
        .epochNanoseconds,
  ],
]
const strings = [
  '1970-01-01T00:00:00.000000001Z',
  '20000229T123456.123456789+0530',
  '1969-12-31T23:59:59.999999999Z',
  '+275760-09-13T23:59:59.999999999+23:59:59.999999999',
  '1970-01-01T00Z[!America/New_York][u-ca=hebrew]',
]
pairs.push([
  'from ISO string/get epochNanoseconds',
  i => Instant.from(strings[i % strings.length]).epochNanoseconds,
  i => reference.Instant.from(strings[i % strings.length]).epochNanoseconds,
])
let sink = 0n
const throughput = pairs.map(([name, ours, theirs]) => {
  for (let i = 0; i < 5000; i++) {
    if (ours(i) !== theirs(i)) throw new Error(`Results disagree: ${name}`)
    sink ^= ours(i) ^ theirs(i)
  }
  const samples: number[][] = [[], []]
  for (let sample = 0; sample < 7; sample++) {
    for (const index of sample % 2 ? [1, 0] : [0, 1]) {
      const operation = index === 0 ? ours : theirs
      const start = performance.now()
      for (let i = 0; i < 50000; i++) sink ^= operation(i)
      samples[index].push(((performance.now() - start) * 1e6) / 50000)
    }
  }
  for (const values of samples) values.sort((a, b) => a - b)
  return {
    name,
    oursMedianNs: samples[0][3],
    referenceMedianNs: samples[1][3],
    samples,
  }
})
const sizes = [
  'instant-code.js',
  'calendar-code.js',
  'reference-bundle.js',
].map(file => {
  const source = readFileSync(resolve(file), 'utf8')
  const code = transformSync(source, {
    loader: 'js',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).code
  return {
    file,
    minified: Buffer.byteLength(code),
    minifiedGzip: gzipSync(code, {level: 9}).length,
  }
})
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
      scope:
        'Instant constructor/factories/getters and ISO string parsing, versus forced temporal-polyfill 1.0.7 classes. Partial API; no full-polyfill size or conformance claim.',
      sizes,
      throughput,
      sink: String(sink),
    },
    null,
    2
  )
)
