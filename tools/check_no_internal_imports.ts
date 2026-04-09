import {readFileSync, readdirSync, statSync} from 'fs'
import {join} from 'path'

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

// CLI entry point
if (
  process.argv[1] &&
  (process.argv[1].endsWith('check_no_internal_imports.ts') ||
    process.argv[1].endsWith('check_no_internal_imports.js'))
) {
  const args = process.argv.slice(2)
  const errors: string[] = []

  for (const arg of args) {
    errors.push(...checkPath(arg))
  }

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`FAIL: internal import '#packages/' found in ${err}`)
    }
    process.exit(1)
  }

  console.log('PASS: no internal imports found')
}
