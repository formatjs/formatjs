import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {gzipSync} from 'node:zlib'
import {build, type Plugin} from 'esbuild'
import ts from 'typescript'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const reference = runfiles.resolve(process.argv[3])
const snapshot = JSON.parse(
  readFileSync(runfiles.resolve(process.argv[4]), 'utf8')
) as {results: {name: string; bundleGzipBytes: number}[]}
const index = join(directory, 'index.js')

interface Variant {
  name: string
  native?: boolean
  functions?: string[]
  bodies?: Record<string, string>
  variables?: Record<string, string>
}

function diagnostic(variant: Variant, changed: {nodes: number}): Plugin {
  const published = readFileSync(index, 'utf8')
  const bodies = {
    ...Object.fromEntries(
      (variant.functions ?? []).map(name => [
        name,
        '{throw new Error("Diagnostic feature removed")}',
      ])
    ),
    ...variant.bodies,
  }
  return {
    name: 'diagnostic-feature-removal',
    setup(context) {
      context.onLoad({filter: /\.js$/}, args => {
        const source = readFileSync(args.path, 'utf8')
        if (source !== published) return
        const parsed = ts.createSourceFile(
          index,
          source,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.JS
        )
        const edits: {start: number; end: number; text: string}[] = []
        const found = new Set<string>()
        function visit(node: ts.Node): void {
          if (
            variant.native &&
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === 'nativeTemporal'
          ) {
            edits.push({
              start: node.getStart(parsed),
              end: node.end,
              text: 'undefined',
            })
            found.add('nativeTemporal')
            return
          }
          if (
            ts.isFunctionDeclaration(node) &&
            node.name &&
            node.body &&
            Object.hasOwn(bodies, node.name.text)
          ) {
            edits.push({
              start: node.body.getStart(parsed),
              end: node.body.end,
              text: bodies[node.name.text],
            })
            found.add(node.name.text)
            return
          }
          if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.initializer &&
            variant.variables &&
            Object.hasOwn(variant.variables, node.name.text)
          ) {
            edits.push({
              start: node.initializer.getStart(parsed),
              end: node.initializer.end,
              text: variant.variables[node.name.text],
            })
            found.add(node.name.text)
            return
          }
          ts.forEachChild(node, visit)
        }
        visit(parsed)
        for (const name of [
          ...Object.keys(bodies),
          ...Object.keys(variant.variables ?? {}),
        ])
          assert(found.has(name), name)
        if (variant.native) assert(found.has('nativeTemporal'))
        changed.nodes += edits.length
        let contents = source
        for (const edit of edits.sort((a, b) => b.start - a.start))
          contents =
            contents.slice(0, edit.start) + edit.text + contents.slice(edit.end)
        return {
          contents: contents.replace(/^\/\/# sourceMappingURL=.*$/gm, ''),
          loader: 'js',
          resolveDir: directory,
        }
      })
    },
  }
}

const locale = ['localeDateTime', 'localeDuration']
const calendars = [
  'hostCalendarYear',
  'hostCalendarDate',
  'hostCalendarAddMonths',
  'hostCalendarMonthDifference',
]
const timezoneMetadata = {
  temporal_names_default: '[]',
  steps: '{}',
  links_default: '{}',
  primary_default: '{}',
}
const variants: Variant[] = [
  {name: 'typescript'},
  {name: 'referenceFull'},
  {name: 'withoutNativeDispatch', native: true},
  {name: 'withoutLocaleFormatting', functions: locale},
  {
    name: 'withoutCalendarFormattingCorrections',
    bodies: {
      legacyCalendarParts: '{return undefined}',
      correctLunisolarParts: '{return raw}',
    },
  },
  {name: 'withoutLunarAndUmmAlQuraEngines', functions: calendars},
  {name: 'withoutTimezoneMetadata', variables: timezoneMetadata},
  ...Object.entries(timezoneMetadata).map(([name, value]) => ({
    name: `withoutMetadata:${name}`,
    variables: {[name]: value},
  })),
  {
    name: 'withoutThoseThreeFeatures',
    native: true,
    functions: [...locale, ...calendars],
  },
  {
    name: 'withoutThoseFourFeatures',
    native: true,
    functions: [...locale, ...calendars],
    variables: timezoneMetadata,
  },
]
const results = []
for (const variant of variants) {
  const input = variant.name === 'referenceFull' ? reference : index
  const changed = {nodes: 0}
  const altered = Boolean(
    variant.native || variant.functions || variant.bodies || variant.variables
  )
  const bundle = await build({
    stdin: {
      contents: `export {Temporal} from ${JSON.stringify(input)}`,
      resolveDir: directory,
      sourcefile: 'consumer.mjs',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    minify: true,
    legalComments: 'none',
    write: false,
    plugins: altered ? [diagnostic(variant, changed)] : [],
  })
  if (altered) assert(changed.nodes > 0, 'Diagnostic rewrite must run')
  const contents = bundle.outputFiles[0].contents
  const gzipBytes = gzipSync(contents, {level: 9}).length
  const previous = snapshot.results.find(row => row.name === variant.name)
  if (previous) assert.equal(gzipBytes, previous.bundleGzipBytes)
  results.push({
    name: variant.name,
    bytes: contents.byteLength,
    gzipBytes,
    rewrittenNodes: changed.nodes,
  })
}
const baseline = results[0].gzipBytes
console.log(
  JSON.stringify(
    {
      method:
        'Same published namespace consumer, esbuild es2022 minification and gzip level 9 as startup benchmark. Baseline and full reference must exactly match recorded sizes. TypeScript AST rewrites disable selected functions before tree shaking; combined removal measured independently. Savings overlap and are not additive.',
      scope:
        'Diagnostic feature removals, not equivalent implementations or proposed API changes. Removing native dispatch disables backend installation; removing locale formatting breaks toLocaleString; removing corrections loses calendar field/host-boundary repairs; removing lunar/Umm al-Qura engines breaks those calendars; empty timezone metadata breaks named-zone validation, alias identity and transition sampling guarantees. No conformance claim for altered builds. No source maps, declarations or WASM payload included.',
      results: results.map(row => ({
        ...row,
        savedGzipBytes: baseline - row.gzipBytes,
      })),
    },
    null,
    2
  )
)
