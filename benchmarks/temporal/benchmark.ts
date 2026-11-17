import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {cpus} from 'node:os'
import {performance} from 'node:perf_hooks'
import {pathToFileURL} from 'node:url'
import {gzipSync} from 'node:zlib'
import {transformSync} from 'esbuild'

const resolve = (file: string) =>
  runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/benchmarks/temporal/${file}`
  )
const kernelPath = resolve('kernel-all-zones.js')
const referencePath = resolve('reference-bundle.js')
const kernel = await import(pathToFileURL(kernelPath).href)
const {Temporal} = await import(pathToFileURL(referencePath).href)
const zone = kernel.timeZone('America/New_York')
const instants = [
  0n,
  -1n,
  1710053999999999999n,
  1710054000000000000n,
  16731446400000000000n,
]
const locals = [
  {year: 2024, month: 3, day: 10, hour: 2, minute: 30},
  {year: 2024, month: 11, day: 3, hour: 1, minute: 30},
  {year: 2024, month: 6, day: 1, hour: 12},
]
let sink = 0n
function measure(operation: (i: number) => bigint) {
  for (let i = 0; i < 5000; i++) sink ^= operation(i)
  const samples = []
  for (let sample = 0; sample < 7; sample++) {
    const start = performance.now()
    for (let i = 0; i < 20000; i++) sink ^= operation(i)
    samples.push(((performance.now() - start) * 1e6) / 20000)
  }
  samples.sort((a, b) => a - b)
  return {medianNs: samples[3], minNs: samples[0], maxNs: samples[6]}
}
const pairs: [string, (i: number) => bigint, (i: number) => bigint][] = [
  [
    'offset lookup',
    i => zone.offsetNanoseconds(instants[i % instants.length]),
    i =>
      BigInt(
        new Temporal.Instant(instants[i % instants.length]).toZonedDateTimeISO(
          'America/New_York'
        ).offsetNanoseconds
      ),
  ],
  [
    'resolve local (ordinary/gap/fold)',
    i => zone.resolve(locals[i % locals.length]),
    i =>
      Temporal.ZonedDateTime.from({
        ...locals[i % locals.length],
        timeZone: 'America/New_York',
      }).epochNanoseconds,
  ],
  [
    'ISO add day',
    i =>
      BigInt(
        kernel.addISODays({year: 2024, month: 2, day: (i % 28) + 1}, 1).day
      ),
    i =>
      BigInt(
        Temporal.PlainDate.from({year: 2024, month: 2, day: (i % 28) + 1}).add({
          days: 1,
        }).day
      ),
  ],
]
const throughput = pairs.map(([name, ours, reference]) => {
  for (let i = 0; i < 30; i++)
    if (ours(i) !== reference(i))
      throw new Error(`Benchmark disagrees: ${name}`)
  return {name, kernel: measure(ours), temporalPolyfill: measure(reference)}
})
function coldImport(file: string) {
  const samples = []
  for (let i = 0; i < 5; i++) {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `const t=performance.now();const before=process.memoryUsage().heapUsed;const m=await import(${JSON.stringify(pathToFileURL(file).href)});const imported=performance.now();if(m.timeZone)m.timeZone("America/New_York").offsetNanoseconds(0n);else new m.Temporal.Instant(0n).toZonedDateTimeISO("America/New_York").offsetNanoseconds;console.log(JSON.stringify({importMilliseconds:imported-t,firstOffsetMilliseconds:performance.now()-imported,heapBytes:process.memoryUsage().heapUsed-before}));`,
      ],
      {encoding: 'utf8'}
    )
    if (result.status !== 0) throw new Error(result.stderr)
    samples.push(JSON.parse(result.stdout))
  }
  return samples
}
const sizes = [
  'kernel-code.js',
  'kernel-all-zones.js',
  'reference-bundle.js',
].map(file => {
  const source = readFileSync(resolve(file), 'utf8')
  const minified = transformSync(source, {
    loader: 'js',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).code
  return {
    file,
    bytes: Buffer.byteLength(source),
    gzip: gzipSync(source, {level: 9}).length,
    minified: Buffer.byteLength(minified),
    minifiedGzip: gzipSync(minified, {level: 9}).length,
  }
})
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      icu: process.versions.icu,
      tz: process.versions.tz,
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0].model,
      scope:
        'Numeric ISO/timezone kernel versus forced temporal-polyfill 1.0.7 classes; unequal API coverage. Kernel all-zones embeds IANA; reference uses host Intl. No full-polyfill speed/size claim.',
      sizes,
      throughput,
      coldImport: {
        kernelAllZones: coldImport(kernelPath),
        temporalPolyfill: coldImport(referencePath),
      },
      sink: String(sink),
    },
    null,
    2
  )
)
