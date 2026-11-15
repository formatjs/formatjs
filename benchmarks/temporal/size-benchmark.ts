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
        'Owned namespace with Now and standalone Date bridge, conditional global installation, force installation and detection. Owned IANA 2026f data included except detection. Forced temporal-polyfill 1.0.7 reference uses host Intl and has broader calendar/locale support. Size only; prior throughput and primitive WASM profiles remain separate. Bundles are alternatives, not additive.',
      method:
        'Bazel Rolldown bundles, esbuild es2022 minification, gzip level 9; byte lengths include newline.',
      sizes,
      publishedModules,
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
