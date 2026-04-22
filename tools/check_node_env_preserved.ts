import {readFileSync, readdirSync, statSync} from 'fs'
import {join} from 'path'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  _: string[]
}

const PATTERN = /process\.env\.NODE_ENV/

export function checkFile(filePath: string): string[] {
  if (!/\.js$/.test(filePath)) return []
  const content = readFileSync(filePath, 'utf8')
  if (PATTERN.test(content)) return []
  return [`${filePath}: process.env.NODE_ENV not found in bundle output`]
}

export function checkPath(targetPath: string): string[] {
  const stat = statSync(targetPath, {throwIfNoEntry: false})
  if (!stat) return []

  if (stat.isFile()) {
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
      console.error(`FAIL: ${err}`)
    }
    process.exit(1)
  }

  console.log('PASS: process.env.NODE_ENV preserved in bundle output')
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
