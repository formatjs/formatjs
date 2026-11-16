import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {gzipSync} from 'node:zlib'
import {buildSync, transformSync} from 'esbuild'

const sizes = ['standalone', 'hostCalendars', 'referenceFull'].map(
  (profile, index) => {
    const source = readFileSync(
        runfiles.resolve(process.argv[index + 2]),
        'utf8'
      ),
      minified = transformSync(source, {
        loader: 'js',
        target: 'es2022',
        minify: true,
        legalComments: 'none',
      }).code
    return {
      profile,
      raw: Buffer.byteLength(source),
      minified: Buffer.byteLength(minified),
      minifiedGzip: gzipSync(minified, {level: 9}).length,
    }
  }
)
const publishedDirectory = runfiles.resolve(process.argv[5])
const publishedConsumers = ['index.js', 'standalone.js'].map(file => {
  const code = buildSync({
    stdin: {
      contents: `export * from './${file}';`,
      resolveDir: publishedDirectory,
      sourcefile: 'measurement-entry.js',
      loader: 'js',
    },
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
  }).outputFiles[0].contents
  return {
    file,
    minified: code.length,
    minifiedGzip: gzipSync(code, {level: 9}).length,
  }
})
console.log(
  JSON.stringify(
    {
      node: process.version,
      icu: process.versions.icu,
      cldr: process.versions.cldr,
      scope:
        'Full namespaces. Default uses bounded ICU4X historical data and arithmetic for Chinese/Dangi, host Intl for Umm al-Qura, captured installed Intl for named timezones and numeric arithmetic calendars. Standalone retains full-range calendar packs and compact owned timezone histories. Legacy plain and numeric non-Gregorian formatting uses host labels and compact CLDR Before Hijrah labels. Full reference uses host Intl for calendar and timezone data. Size only; conformance recorded separately.',
      method:
        'Bazel Rolldown bundles, esbuild es2022 minification, gzip level 9; byte lengths include newline.',
      sizes,
      publishedConsumers,
    },
    null,
    2
  )
)
