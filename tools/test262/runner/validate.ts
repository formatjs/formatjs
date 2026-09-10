import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join, resolve} from 'node:path'
import minimist from 'minimist'
import {summarize, compare, type Baseline} from './results.ts'

interface Args extends minimist.ParsedArgs {
  suite: string
  report: string
  status: string
  stderr: string
  baseline: string
}

export function validateReport(
  report: string,
  status: number,
  expected: Baseline
): string[] {
  if (![0, 1].includes(status))
    throw new Error(`Test262 harness exited ${status}`)
  // The upstream JSON reporter emits only a closing bracket for an empty stream.
  if (report.trim() === ']') throw new Error('Test262 discovered no tests')
  const actual = summarize(JSON.parse(report))
  const failed = Object.keys(actual.failures).length
  if (status !== (failed ? 1 : 0))
    throw new Error('Test262 exit status disagrees with its results')
  return compare(actual, expected)
}

export function main(args: Args): number {
  const report = readFileSync(args.report, 'utf8')
  const statusText = readFileSync(args.status, 'utf8').trim()
  if (!/^\d+$/.test(statusText)) throw new Error('Invalid Test262 exit status')
  const status = Number(statusText)
  const stderr = readFileSync(args.stderr, 'utf8')
  if (stderr) process.stderr.write(stderr)
  const expected: Baseline = JSON.parse(readFileSync(args.baseline, 'utf8'))
  const errors = validateReport(report, status, expected)
  const actual = summarize(JSON.parse(report))
  const failed = Object.keys(actual.failures).length
  const out = process.env.TEST_UNDECLARED_OUTPUTS_DIR
  if (out) {
    mkdirSync(out, {recursive: true})
    writeFileSync(join(out, 'results.json'), report)
    writeFileSync(
      join(out, 'baseline-candidate.json'),
      JSON.stringify(actual, null, 2) + '\n'
    )
  }
  console.log(
    `${args.suite}: ${actual.total - failed} passed, ${failed} failed, ${actual.total} executed; ${Object.keys(expected.failures).length} tracked failures`
  )
  for (const error of errors) console.error(error)
  return errors.length ? 1 : 0
}

if (import.meta.filename === resolve(process.argv[1])) {
  process.exitCode = main(minimist<Args>(process.argv.slice(2)))
}
