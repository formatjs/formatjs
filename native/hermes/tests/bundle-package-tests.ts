import {rolldown} from 'rolldown'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from 'node:fs'
import {resolve, basename, join} from 'node:path'
import {runInNewContext} from 'node:vm'
import minimist from 'minimist'

const packages: Record<string, {constructor: string; files: string[]}> = {
  getcanonicallocales: {
    constructor: 'getCanonicalLocales',
    files: ['index.test.ts'],
  },
  supportedvaluesof: {
    constructor: 'supportedValuesOf',
    files: ['index.test.ts'],
  },
  locale: {
    constructor: 'Locale',
    files: [
      'index.test.ts',
      'info-spec.test.ts',
      'likely-subtags.test.ts',
      'minimize.test.ts',
    ],
  },
  pluralrules: {
    constructor: 'PluralRules',
    files: ['index.test.ts', 'supported-locales-of.test.ts'],
  },
  listformat: {
    constructor: 'ListFormat',
    files: ['index.test.ts', 'supported-locales-of.test.ts'],
  },
  displaynames: {constructor: 'DisplayNames', files: ['index.test.ts']},
  segmenter: {
    constructor: 'Segmenter',
    files: ['grapheme.test.ts', 'word.test.ts', 'sentence.test.ts'],
  },
  collator: {constructor: 'Collator', files: ['index.test.ts']},
  relativetimeformat: {
    constructor: 'RelativeTimeFormat',
    files: ['index.test.ts', 'supported-locales-of.test.ts'],
  },
  durationformat: {constructor: 'DurationFormat', files: ['index.test.ts']},
  numberformat: {constructor: 'NumberFormat', files: []},
  datetimeformat: {
    constructor: 'DateTimeFormat',
    files: [
      'calendar-loading.test.ts',
      'index.test.ts',
      'format.test.ts',
      'format-range.test.ts',
      'ftp-main.test.ts',
      'offset-timezone.test.ts',
    ],
  },
}

async function main() {
  const args = minimist(process.argv.slice(2))
  const kind = args.kind as string,
    output = args.out as string
  if (!Object.hasOwn(packages, kind) || !output)
    throw Error('--kind and --out required')
  const root =
    process.env.JS_BINARY__EXECROOT && process.env.BAZEL_BINDIR
      ? join(process.env.JS_BINARY__EXECROOT, process.env.BAZEL_BINDIR)
      : process.cwd()
  process.chdir(root)
  const base = `packages/intl-${kind}/tests`
  const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
  const files =
    kind === 'numberformat'
      ? readdirSync(base).filter(
          file =>
            file.endsWith('.test.ts') && file !== 'format_to_parts.test.ts'
        )
      : packages[kind].files
  const entries = files.map(file => ({
    name: file,
    source: `import ${JSON.stringify(resolve(base, file))}`,
    snapshots: [`${base}/__snapshots__/${file}.snap`],
  }))
  if (kind === 'numberformat') {
    for (const type of ['currency', 'decimal', 'percent', 'unit']) {
      const names = readdirSync(`${base}/${type}/__snapshots__`).filter(file =>
        file.endsWith('.snap')
      )
      const source = names
        .map(file => {
          const locale = file.slice(0, -'.generated.test.ts.snap'.length)
          return `import '@formatjs/intl-pluralrules/locale-data/${locale.split('-')[0]}.js';\nimport {test as test_${locale.replace(/-/g, '_')}} from '#packages/intl-numberformat/tests/${type}/${type}Test';\nimport data_${locale.replace(/-/g, '_')} from '#packages/intl-numberformat/tests/locale-data/${locale}.json';\ntest_${locale.replace(/-/g, '_')}('${locale}', data_${locale.replace(/-/g, '_')});`
        })
        .join('\n')
      entries.push({
        name: `${type}.matrix.ts`,
        source,
        snapshots: names.map(name => `${base}/${type}/__snapshots__/${name}`),
      })
    }
  }
  const fixtures: Record<string, unknown> = {}
  if (kind === 'numberformat')
    for (const file of readdirSync(`${base}/locale-data`)) {
      if (file.endsWith('.json'))
        fixtures[`./locale-data/${file}`] = JSON.parse(
          read(`${base}/locale-data/${file}`)
        )
    }
  const ctor = packages[kind].constructor
  const nativePacks: Record<string, unknown> = {}
  const localeDirectory = `${base}/locale-data`
  if (existsSync(localeDirectory))
    for (const file of readdirSync(localeDirectory)) {
      if (
        file.endsWith('.json') ||
        (kind === 'pluralrules' && file.endsWith('.ts'))
      ) {
        const locale = file.replace(/\.(json|ts)$/, '')
        const path = `crates/intl_${kind}/locale-data/${locale}.json`
        if (!existsSync(path))
          throw Error('Missing native transport envelope: ' + path)
        const pack = JSON.parse(read(path))
        const {data: _data, ...envelope} = pack
        nativePacks[locale] = kind === 'pluralrules' ? pack : envelope
      }
    }
  if (kind === 'durationformat') {
    nativePacks.number = JSON.parse(
      read('crates/intl_numberformat/locale-data/en.json')
    )
    nativePacks.list = JSON.parse(
      read('crates/intl_listformat/locale-data/en.json')
    )
  }
  let candidate = `
import '@formatjs/intl-pluralrules/polyfill-force.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import {${ctor} as Reference} from '@formatjs/intl-${kind}';
export const ${ctor} = Intl.${ctor};
if (!${ctor}.polyfilled) throw Error('Rust JSI formatter missing');
const original = ${ctor}.__addLocaleData;
${ctor}.__addLocaleData = (...packs) => {
  Reference.__addLocaleData(...packs);
  original(...packs.map(pack => typeof pack === 'string' ? pack : JSON.stringify({...globalThis.__NATIVE_PACKS[pack.locale] || globalThis.__NATIVE_PACKS[pack.locale.split('-')[0]] || globalThis.__NATIVE_PACKS.en, ...pack})));
};
${kind === 'datetimeformat' ? `for (const key of ['__addCalendarLocaleData', '__addTZData']) { const load = ${ctor}[key]; ${ctor}[key] = (...packs) => { Reference[key](...packs); load(...packs.map(pack => typeof pack === 'string' ? pack : JSON.stringify(pack))); }; }` : ''}
Intl.${ctor} = Reference;
`
  if (!['numberformat', 'datetimeformat'].includes(kind)) {
    const defaultExport = ['listformat', 'relativetimeformat'].includes(kind)
    const refImport = defaultExport ? 'Reference' : `{${ctor} as Reference}`
    candidate = `import ${refImport} from '@formatjs/intl-${kind}';
export const ${ctor} = Intl.${ctor}; export default ${ctor};
if (${ctor} === Reference) throw Error('Candidate is TypeScript reference');
${['getcanonicallocales', 'supportedvaluesof'].includes(kind) ? '' : `Intl.${ctor} = Reference;`}
`
    if (
      [
        'pluralrules',
        'listformat',
        'displaynames',
        'relativetimeformat',
      ].includes(kind)
    )
      candidate += `
const load = ${ctor}.__addLocaleData;
${ctor}.__addLocaleData = (...packs) => {
  Reference.__addLocaleData(...packs);
  for (const pack of packs) {
    const envelope = globalThis.__NATIVE_PACKS[pack.locale] || ${kind === 'pluralrules' ? 'undefined' : '{formatVersion: 1, aliases: []}'};
    if (!envelope) throw Error('Missing native locale: '+pack.locale);
    load(JSON.stringify(${kind === 'pluralrules' ? 'envelope' : '{...envelope, ...pack}'}));
  }
};`
    if (kind === 'durationformat')
      candidate += `
${ctor}.__addNumberFormatData(JSON.stringify(globalThis.__NATIVE_PACKS.number));
${ctor}.__addListFormatData(JSON.stringify(globalThis.__NATIVE_PACKS.list));`
  }
  // Supporting formatters stay real TS implementations; only the candidate is Rust.
  let bootstrap =
    kind === 'pluralrules'
      ? ''
      : "import '@formatjs/intl-pluralrules/polyfill-force.js';\nimport '@formatjs/intl-pluralrules/locale-data/en.js';\n"
  if (kind !== 'getcanonicallocales')
    bootstrap =
      "import '@formatjs/intl-locale/polyfill-force.js';\n" + bootstrap
  if (
    [
      'supportedvaluesof',
      'locale',
      'pluralrules',
      'relativetimeformat',
      'durationformat',
    ].includes(kind)
  ) {
    bootstrap +=
      "import '@formatjs/intl-numberformat/polyfill-force.js';\nimport '@formatjs/intl-numberformat/locale-data/en.js';\n"
  }
  if (kind === 'relativetimeformat')
    for (const locale of Object.keys(nativePacks)) {
      bootstrap += `import '@formatjs/intl-numberformat/locale-data/${locale}.js';\nimport '@formatjs/intl-pluralrules/locale-data/${locale.split('-')[0]}.js';\n`
    }
  if (kind === 'locale')
    bootstrap +=
      "import '@formatjs/intl-numberformat/locale-data/ar.js';\nimport '@formatjs/intl-numberformat/locale-data/ar-EG.js';\nimport '@formatjs/intl-numberformat/locale-data/ar-SA.js';\nimport '@formatjs/intl-numberformat/locale-data/ja.js';\nimport '@formatjs/intl-numberformat/locale-data/pt.js';\n"
  if (['supportedvaluesof', 'locale'].includes(kind))
    bootstrap += `
import '@formatjs/intl-datetimeformat/polyfill-force.js';
import '@formatjs/intl-datetimeformat/locale-data/en.js';
import '@formatjs/intl-collator/polyfill-force.js';
import timezone from '@formatjs_generated/tz/all-tz.js';
Intl.DateTimeFormat.__addTZData(timezone);
`
  if (kind === 'durationformat')
    bootstrap +=
      "import '@formatjs/intl-listformat/polyfill-force.js';\nimport '@formatjs/intl-listformat/locale-data/en.js';\n"
  const ucd: Record<string, string> = {}
  if (kind === 'segmenter')
    for (const name of [
      'GraphemeBreakTest',
      'SentenceBreakTest',
      'WordBreakTest',
    ]) {
      ucd[`+http_file+${name}/file/downloaded`] = readFileSync(
        resolve(process.env.JS_BINARY__EXECROOT || root, args[name]),
        'utf8'
      )
    }
  mkdirSync(output, {recursive: true})
  const manifest = []
  for (const entry of entries) {
    const snapshots: Record<string, unknown> = {}
    for (const path of entry.snapshots)
      if (existsSync(path)) {
        const exported: Record<string, string> = {}
        runInNewContext(read(path), {exports: exported}, {timeout: 1000})
        const keys = Object.keys(exported)
        const values = runInNewContext(
          '[' +
            Object.values(exported)
              .map(value => '(' + value + ')')
              .join(',') +
            ']',
          {},
          {timeout: 1000}
        )
        for (const [index, key] of keys.entries()) {
          if (key in snapshots) throw Error('Duplicate snapshot key: ' + key)
          snapshots[key] = values[index]
        }
      }
    const exclusions: Record<string, string> = {}
    // Keep TS-private state, diagnostic wording, and host Date methods out of Intl conformance.
    if (kind === 'numberformat' && entry.name === 'misc.test.ts') {
      exclusions[
        'hydrates numbering-system aliases without mutating supplied data'
      ] = 'TS localeData hydration internals'
      exclusions[
        'falls back to the currency code when a locale has no translated currency name'
      ] = 'TS localeData mutation'
      for (const name of [
        'uses an invalid value for rounding increment',
        'roundingIncrement > 1 with undefined fraction digits',
      ])
        exclusions[
          `For wrong options NumberFormat correctly throws exception > ${name}`
        ] =
          'Implementation-defined TS error message; RangeError checks remain in native conformance'
    }
    if (kind === 'datetimeformat' && entry.name === 'index.test.ts') {
      exclusions[
        'Intl.DateTimeFormat > shares Gregorian formats with explicitly supplied ISO locale data'
      ] = 'TS localeData mutation'
      for (const name of [
        'toLocaleString returns "Invalid Date", GH #3508',
        'toLocaleString returns date and time with the default format, GH #3508',
        'toLocaleTimeString returns "Invalid Date", GH #3508',
        'toLocaleDateString returns "Invalid Date", GH #3508',
      ])
        exclusions[`Intl.DateTimeFormat > ${name}`] =
          'Host Date.prototype method; extension installs Intl.DateTimeFormat only'
      for (const calendar of ['gregory', 'chinese'])
        exclusions[
          `Intl.DateTimeFormat > parses cold ${calendar} formats without inherited setters`
        ] = 'TS localeData mutation'
    }
    if (kind === 'locale' && entry.name === 'index.test.ts')
      for (const locale of ['ar', 'ar-EG', 'ar-SA', 'ja', 'pt-BR'])
        exclusions[
          `intl-locale > new locale info proposal properties > ${locale} collations`
        ] =
          'ICU collation availability; embedding Collator supplies a different supported set'
    if (kind === 'collator')
      exclusions['Intl.Collator > keeps CLDR root out of locale negotiation'] =
        'TS private availableLocales table; public locale negotiation remains covered'
    if (kind === 'durationformat')
      exclusions[
        'numbering system support refreshes when NumberFormat is replaced'
      ] =
        'TS delegates to host NumberFormat; Rust owns its internal formatter registry'
    if (kind === 'pluralrules' && entry.name === 'index.test.ts')
      exclusions['preserves plural operands above Number.MAX_SAFE_INTEGER'] =
        'Direct TS GetOperands helper; Rust operand tests cover native implementation'
    const harness = resolve('native/hermes/tests/package-harness.ts')
    const bundle = await rolldown({
      input: 'package-entry',
      platform: 'neutral',
      plugins: [
        {
          name: 'hermes-package-conformance',
          resolveId(id) {
            if (
              id === 'package-entry' ||
              id === 'candidate' ||
              id === 'package-bootstrap'
            )
              return '\0' + id
            if (
              id === 'vitest' ||
              id.endsWith('/native/hermes/tests/package-harness.ts')
            )
              return '\0package-harness.ts'
            if (
              id === `#packages/intl-${kind}/core` ||
              id === `#packages/intl-${kind}/core.js` ||
              id === `#packages/intl-${kind}/index.js` ||
              (kind === 'segmenter' &&
                id === '#packages/intl-segmenter/segmenter.js')
            )
              return '\0candidate'
            if (
              [
                `#packages/intl-${kind}/polyfill-force.js`,
                `@formatjs/intl-${kind}/polyfill-force.js`,
                `@formatjs/intl-${kind}/polyfill.js`,
              ].includes(id)
            )
              return '\0empty'
            if (kind === 'segmenter' && id === 'node:fs') return '\0package-fs'
            if (kind === 'segmenter' && id === '@bazel/runfiles')
              return '\0package-runfiles'
            if (id.startsWith('#packages/')) {
              let path = resolve('packages', id.slice('#packages/'.length))
              if (path.endsWith('.js') && !existsSync(path))
                path = path.slice(0, -3) + '.ts'
              if (!existsSync(path) && existsSync(path + '.ts')) path += '.ts'
              return path
            }
          },
          load(id) {
            if (id === '\0package-harness.ts') return read(harness)
            if (id === '\0candidate') return candidate
            if (id === '\0empty') return ''
            if (id === '\0package-bootstrap') return bootstrap
            if (id === '\0package-fs')
              return 'export const readFileSync = path => {if (!(path in globalThis.__UCD)) throw Error("Missing Unicode fixture: "+path); return globalThis.__UCD[path]}'
            if (id === '\0package-runfiles')
              return 'export class Runfiles {resolve(path) {return path}}'
            if (id === '\0package-entry')
              return `import 'candidate';\nimport 'package-bootstrap';\nimport {beginFile, finishFile, report} from ${JSON.stringify(harness)};\n${entry.name.endsWith('.matrix.ts') ? `beginFile(${JSON.stringify(entry.name)});\n${entry.source}\nfinishFile();` : entry.source}\nreport();`
          },
          transform(code, id) {
            if (!id.includes(base + '/') || !id.endsWith('.test.ts')) return
            // Vitest's test bodies and expected values remain unchanged.
            return `import {beginFile, finishFile} from ${JSON.stringify(harness)};\nbeginFile(${JSON.stringify(basename(id))});\n${code.replace(/\brequire\(/g, 'globalThis.__packageRequire(')}\nfinishFile();`
          },
        },
      ],
    })
    const result = await bundle.generate({
      format: 'iife',
      inlineDynamicImports: true,
    })
    const prelude = `globalThis.process={env:{TZ:'UTC'}};globalThis.__UCD=${JSON.stringify(ucd)};globalThis.__NATIVE_PACKS=${JSON.stringify(nativePacks)};globalThis.__PACKAGE_SNAPSHOTS=${JSON.stringify(snapshots)};globalThis.__PACKAGE_EXCLUSIONS=${JSON.stringify(exclusions)};const __packageData=${JSON.stringify(fixtures)};globalThis.__packageRequire=path=>{if(!(path in __packageData))throw Error('Missing package fixture: '+path);return __packageData[path]};\n`
    const file = entry.name.replace(/\.ts$/, '.js')
    writeFileSync(join(output, file), prelude + result.output[0].code)
    manifest.push({
      file,
      source: entry.name,
      snapshots: Object.keys(snapshots).length,
    })
    await bundle.close()
  }
  writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest))
}
await main()
