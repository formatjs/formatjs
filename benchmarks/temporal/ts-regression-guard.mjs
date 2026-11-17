import {parseSync, traverse} from '@babel/core'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'

function normalize(file) {
  const ast = parseSync(readFileSync(file, 'utf8'), {
    sourceType: 'module',
    configFile: false,
    babelrc: false,
  })
  let bindings = 0
  traverse(ast, {
    Scope(path) {
      const ordered = Object.values(path.scope.bindings).sort(
        (one, other) => one.identifier.start - other.identifier.start
      )
      for (const binding of ordered)
        path.scope.rename(
          binding.identifier.name,
          '__temporal_guard_' + bindings++
        )
    },
  })
  const metadata = new Set([
    'start',
    'end',
    'loc',
    'comments',
    'tokens',
    'extra',
  ])
  const json = JSON.stringify(ast, (key, value) =>
    metadata.has(key)
      ? undefined
      : typeof value === 'bigint'
        ? String(value) + 'n'
        : value
  )
  return {
    json,
    sha256: createHash('sha256').update(json).digest('hex'),
    bindings,
  }
}

const [baselineFile, currentFile] = process.argv.slice(2)
if (!baselineFile || !currentFile)
  throw new Error('Usage: ts_regression_guard baseline.js current.js')
const baseline = normalize(baselineFile)
const current = normalize(currentFile)
const alphaEquivalent = baseline.json === current.json
console.log(
  JSON.stringify(
    {
      normalization:
        'Local binding names canonicalized by lexical position; Babel parser metadata, comments and source locations stripped. All executable structure, globals, property names and literal values retained.',
      alphaEquivalent,
      normalizedAST: {
        baseline: baseline.sha256,
        current: current.sha256,
        bindingCounts: [baseline.bindings, current.bindings],
      },
    },
    null,
    2
  )
)
if (!alphaEquivalent) process.exitCode = 1
