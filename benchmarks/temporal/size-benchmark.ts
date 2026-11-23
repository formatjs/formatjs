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
const graph = (files: string[]): {files: string[]; minifiedGzip: number} => ({
  files,
  minifiedGzip: files.reduce(
    (sum, file) =>
      sum + publishedModules.find(module => module.file === file)!.minifiedGzip,
    0
  ),
})
const namespaceGraph = graph(['index.js', 'native.js'])
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      scope:
        'Owned namespace with Now and standalone Date bridge, conditional global installation, force installation and detection. Default TS uses compact ICU4X lunisolar arithmetic/data and host Intl Umm al-Qura; named timezones use captured installed Intl. Standalone retains full calendar packs and owned IANA histories. Forced temporal-polyfill 1.0.7 full/implementation reference uses host Intl data; basic ISO/Gregorian implementation entry measured separately. Legacy formatting restores plain and numeric non-Gregorian fields using host labels and compact CLDR Before Hijrah labels; Gregorian era probes handle BCE and locale fallback. Size only; historical benchmark snapshots remain separate. Bundles are alternatives, not additive.',
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
          'Required ESM files compressed separately. Consumer bundling can remove unused code. Source maps and declarations are not runtime imports.',
        typescript: namespaceGraph,
        standalone: graph(['standalone.js', 'native.js']),
      },
    },
    null,
    2
  )
)
