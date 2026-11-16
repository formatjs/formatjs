import {join} from 'node:path'
import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {gzipSync} from 'node:zlib'
import {transformSync} from 'esbuild'

const sizes = [
  'instant-code.js',
  'polyfill-code.js',
  'polyfill-force-code.js',
  'should-polyfill-code.js',
  'reference-bundle.js',
  'reference-full-bundle.js',
].map(file => {
  const source = readFileSync(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/benchmarks/temporal/${file}`
    ),
    'utf8'
  )
  const minified = transformSync(source, {
    loader: 'js',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).code
  return {
    file,
    raw: Buffer.byteLength(source),
    minified: Buffer.byteLength(minified),
    minifiedGzip: gzipSync(minified, {level: 9}).length,
  }
})
const publishedDirectory = runfiles.resolve(process.argv[2])
const publishedModules = [
  'index.js',
  'standalone.js',
  'polyfill.js',
  'polyfill-force.js',
  'should-polyfill.js',
  'native.js',
  'wasm.js',
  'wasm-native.js',
].map(file => {
  const source = readFileSync(join(publishedDirectory, file), 'utf8')
  const minified = transformSync(source, {
    loader: 'js',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).code
  return {
    file,
    raw: Buffer.byteLength(source),
    minified: Buffer.byteLength(minified),
    minifiedGzip: gzipSync(minified, {level: 9}).length,
  }
})
const primitiveWasm = readFileSync(runfiles.resolve(process.argv[3]))
const namespaceWasm = readFileSync(
  join(publishedDirectory, 'temporal-backend.wasm')
)
const graph = (files: string[]): {files: string[]; minifiedGzip: number} => ({
  files,
  minifiedGzip: files.reduce(
    (sum, file) =>
      sum + publishedModules.find(module => module.file === file)!.minifiedGzip,
    0
  ),
})
const namespaceGraph = graph(['index.js', 'native.js'])
const wasmGraph = graph(['index.js', 'native.js', 'wasm.js'])
const primitiveJS = ['wasm-ts-code.js', 'wasm-bridge-code.js'].map(file => {
  const source = readFileSync(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/benchmarks/temporal/${file}`
    ),
    'utf8'
  )
  const minified = transformSync(source, {
    loader: 'js',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).code
  return {
    file,
    raw: Buffer.byteLength(source),
    minified: Buffer.byteLength(minified),
    minifiedGzip: gzipSync(minified, {level: 9}).length,
  }
})
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      scope:
        'Owned namespace with Now and standalone Date bridge, conditional global installation, force installation and detection. Default TS uses compact ICU4X lunisolar arithmetic/data and host Intl Umm al-Qura; owned IANA 2026f timezone data remains included. Standalone retains full calendar packs. Forced temporal-polyfill 1.0.7 full/implementation reference uses host Intl data; basic ISO/Gregorian implementation entry measured separately. Legacy lunar formatting corrects stale host calendar fields. Size only; prior throughput and primitive WASM profiles remain separate. Bundles are alternatives, not additive.',
      method:
        'Bazel Rolldown bundles, esbuild es2022 minification, gzip level 9; byte lengths include newline.',
      referenceEntries: {
        'reference-bundle.js':
          'temporal-polyfill/implementation (ISO/Gregorian)',
        'reference-full-bundle.js':
          'temporal-polyfill/full/implementation (all calendars)',
      },
      sizes,
      publishedModules,
      publishedGraphs: {
        scope:
          'Required ESM files compressed separately. Consumer bundling can remove unused code. WASM backend delegates ISO/Instant/PlainTime/calendar/timezone/Duration math, plain/zoned/short-date arithmetic, string parsing and date formatting; all16 native calendar tables and IANA records included. Hybrid WASM retains compact TS calendar and owned timezone data; nativeDataWasm omits duplicate TS tables. JS orchestration remains in both. Source maps, declarations and notices are not runtime imports.',
        typescript: namespaceGraph,
        standalone: graph(['standalone.js', 'native.js']),
        nativeDataWasm: {
          ...graph(['wasm-native.js']),
          binary: {
            raw: namespaceWasm.length,
            gzip: gzipSync(namespaceWasm, {level: 9}).length,
          },
          combinedGzip:
            graph(['wasm-native.js']).minifiedGzip +
            gzipSync(namespaceWasm, {level: 9}).length,
        },
        wasm: {
          ...wasmGraph,
          binary: {
            raw: namespaceWasm.length,
            gzip: gzipSync(namespaceWasm, {level: 9}).length,
          },
          combinedGzip:
            wasmGraph.minifiedGzip + gzipSync(namespaceWasm, {level: 9}).length,
        },
      },
      primitiveProfile: {
        scope:
          'Matched data-free Instant/Duration primitives only, not full facades or calendars/timezones. Prior throughput measurements remain separate.',
        js: primitiveJS,
        wasm: {
          raw: primitiveWasm.length,
          gzip: gzipSync(primitiveWasm, {level: 9}).length,
        },
      },
    },
    null,
    2
  )
)
