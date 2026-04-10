import {readFileSync, readdirSync, statSync} from 'fs'
import {join} from 'path'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  _: string[]
}

const PATTERN = /#packages\//

export function checkFile(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf8')
  const errors: string[] = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (PATTERN.test(lines[i])) {
      errors.push(`${filePath}:${i + 1}: ${lines[i].trim()}`)
    }
  }
  return errors
}

export function checkPath(targetPath: string): string[] {
  const stat = statSync(targetPath, {throwIfNoEntry: false})
  if (!stat) return []

  if (stat.isFile() && /\.(js|d\.ts)$/.test(targetPath)) {
    return checkFile(targetPath)
  }

  if (stat.isDirectory()) {
    const errors: string[] = []
    for (const entry of readdirSync(targetPath)) {
      errors.push(...checkPath(join(targetPath, entry)))
    }
    return errors
  }

  return []
}

function main(args: Args): void {
  const paths: string[] = args._
  if (paths.length === 0) {
    console.error('FAIL: No files or directories provided to check')
    process.exit(1)
  }

  const errors: string[] = []
  for (const p of paths) {
    errors.push(...checkPath(p))
  }

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`FAIL: internal import '#packages/' found in ${err}`)
    }
    process.exit(1)
  }

  console.log('PASS: no internal imports found')
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
