import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join, resolve} from 'node:path'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  suite: string
  root: string
  prelude?: string | string[]
  baseline?: string
  strict?: boolean
}
interface Result {
  file: string
  scenario: string
  result: {pass: boolean; message?: string}
}
export interface Baseline {
  total: number
  failures: Record<string, string>
}

export function summarize(results: Result[]): Baseline {
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('Test262 discovered no tests')
  }
  const seen = new Set<string>()
  const failures: Record<string, string> = {}
  for (const test of results) {
    if (
      typeof test.file !== 'string' ||
      typeof test.scenario !== 'string' ||
      typeof test.result?.pass !== 'boolean'
    ) {
      throw new Error('Invalid Test262 result')
    }
    const file = test.file.replaceAll('\\', '/').split('/test/').at(-1)!
    const key = `${file} (${test.scenario})`
    if (seen.has(key)) throw new Error(`Duplicate Test262 result: ${key}`)
    seen.add(key)
    if (!test.result.pass) {
      if (!test.result.message)
        throw new Error(`Missing failure detail: ${key}`)
      // Stack traces contain sandbox paths. Keep the stable diagnostic line.
      failures[key] = test.result.message.split('\n')[0]
    }
  }
  return {
    total: results.length,
    failures: Object.fromEntries(
      Object.entries(failures).sort(([a], [b]) => a.localeCompare(b))
    ),
  }
}

export function compare(actual: Baseline, expected: Baseline): string[] {
  const errors: string[] = []
  if (
    !Number.isInteger(expected.total) ||
    expected.total <= 0 ||
    !expected.failures ||
    typeof expected.failures !== 'object'
  ) {
    throw new Error('Invalid Test262 baseline')
  }
  if (actual.total !== expected.total)
    errors.push(
      `Test count changed: ${expected.total} expected, ${actual.total} executed`
    )
  for (const [key, message] of Object.entries(actual.failures)) {
    if (!(key in expected.failures))
      errors.push(`Unexpected failure: ${key}: ${message}`)
    else if (expected.failures[key] !== message)
      errors.push(`Failure changed: ${key}: ${message}`)
  }
  for (const key of Object.keys(expected.failures)) {
    if (!(key in actual.failures))
      errors.push(
        `Expected failure no longer present: ${key}; remove or investigate it`
      )
  }
  return errors
}

export function main(args: Args): number {
  const require = createRequire(import.meta.url)
  const cli = require.resolve('test262-harness/bin/run.js')
  const preludes = ([] as string[]).concat(args.prelude || [])
  const child = spawnSync(
    process.execPath,
    [
      cli,
      '--reporter',
      'json',
      '--reporter-keys',
      'file,scenario,result',
      '--errorForFailures',
      '--timeout',
      '30000',
      '--test262Dir',
      args.root,
      ...preludes.flatMap(p => ['--prelude', p]),
      `${args.root}/test/${args.suite}/**/*.js`,
    ],
    {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 600000}
  )
  if (child.stderr) process.stderr.write(child.stderr)
  if (child.error || child.signal || ![0, 1].includes(child.status!)) {
    throw (
      child.error ||
      new Error(
        `Test262 harness exited ${child.status}, signal ${child.signal}`
      )
    )
  }
  // The upstream JSON reporter emits only a closing bracket for an empty stream.
  if (child.stdout.trim() === ']')
    throw new Error('Test262 discovered no tests')
  const actual = summarize(JSON.parse(child.stdout))
  const failed = Object.keys(actual.failures).length
  if (child.status !== (failed ? 1 : 0))
    throw new Error('Test262 exit status disagrees with its results')
  const out = process.env.TEST_UNDECLARED_OUTPUTS_DIR
  if (out) {
    mkdirSync(out, {recursive: true})
    writeFileSync(join(out, 'results.json'), child.stdout)
    writeFileSync(
      join(out, 'baseline-candidate.json'),
      JSON.stringify(actual, null, 2) + '\n'
    )
  }
  const expected: Baseline =
    args.baseline && !args.strict
      ? JSON.parse(readFileSync(args.baseline, 'utf8'))
      : {total: actual.total, failures: {}}
  const errors = compare(actual, expected)
  console.log(
    `${args.suite}: ${actual.total - failed} passed, ${failed} failed, ${actual.total} executed; ${Object.keys(expected.failures).length} tracked failures`
  )
  for (const error of errors) console.error(error)
  return errors.length ? 1 : 0
}

if (import.meta.filename === resolve(process.argv[1])) {
  process.exitCode = main(
    minimist<Args>(process.argv.slice(2), {boolean: ['strict']})
  )
}
