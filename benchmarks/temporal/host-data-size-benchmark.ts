import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {gzipSync} from 'node:zlib'
import {transformSync} from 'esbuild'

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
console.log(
  JSON.stringify(
    {
      node: process.version,
      icu: process.versions.icu,
      cldr: process.versions.cldr,
      scope:
        'Full namespaces. Experimental host-calendar profile replaces Chinese/Dangi/Umm al-Qura tables with Intl, retains owned IANA timezone data and arithmetic calendars. Extended calendar boundary data and full host conformance remain open. Full reference uses host Intl for calendar and timezone data. Size only; profiles do not yet have equal verified coverage.',
      method:
        'Bazel Rolldown bundles, esbuild es2022 minification, gzip level 9; byte lengths include newline.',
      sizes,
    },
    null,
    2
  )
)
