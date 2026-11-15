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
  'polyfill.js',
  'polyfill-force.js',
  'should-polyfill.js',
  'native.js',
  'wasm.js',
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
        'Owned namespace with Now and standalone Date bridge, conditional global installation, force installation and detection. Owned ICU4X calendar and IANA 2026f timezone data included except detection. Forced temporal-polyfill 1.0.7 full/implementation reference uses host Intl and has broader locale integration; basic ISO/Gregorian implementation entry measured separately. Size only; prior throughput and primitive WASM profiles remain separate. Bundles are alternatives, not additive.',
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
          'Required ESM files compressed separately. Consumer bundling can remove unused code. WASM backend delegates ISO/Instant/PlainTime/calendar/timezone/Duration math and plain/zoned arithmetic; all16 native calendar tables and IANA records plus retained TS algorithms/data included. Source maps, declarations and notices are not runtime imports.',
        typescript: namespaceGraph,
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
