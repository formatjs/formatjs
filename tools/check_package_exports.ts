import {readFileSync, existsSync, statSync, readdirSync} from 'fs'
import {join} from 'path'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  _: string[]
}

export function collectPaths(
  obj: Record<string, unknown>,
  cb: (value: string) => void
): void {
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      cb(value)
    } else if (typeof value === 'object' && value !== null) {
      collectPaths(value as Record<string, unknown>, cb)
    }
  }
}

export function validatePackageExports(pkgDir: string): string[] {
  const errors: string[] = []
  const pkgJsonPath = join(pkgDir, 'package.json')

  if (!existsSync(pkgJsonPath)) {
    return [`package.json not found in ${pkgDir}`]
  }

  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
  const exports: Record<string, unknown> = pkg.exports ?? {}

  // Check static (non-wildcard) export paths
  collectPaths(exports, value => {
    if (value.includes('*')) return
    const resolved = join(pkgDir, value)
    if (!existsSync(resolved)) {
      errors.push(`exported path '${value}' not found at '${resolved}'`)
    }
    // Check that .js exports have a corresponding .d.ts file
    if (value.endsWith('.js')) {
      const dtsPath = join(pkgDir, value.replace(/\.js$/, '.d.ts'))
      if (!existsSync(dtsPath)) {
        errors.push(
          `missing declaration file '${value.replace(/\.js$/, '.d.ts')}' for export '${value}'`
        )
      }
    }
  })

  // Check wildcard export directories
  collectPaths(exports, value => {
    if (!value.includes('*')) return
    const dir = join(pkgDir, value.replace('/*', ''))
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      errors.push(`exported directory '${value}' not found at '${dir}'`)
    } else if (readdirSync(dir).length === 0) {
      errors.push(`exported directory '${value}' is empty at '${dir}'`)
    } else {
      // Check that .js files in wildcard dirs have corresponding .d.ts
      const jsFiles = readdirSync(dir).filter(f => f.endsWith('.js'))
      for (const jsFile of jsFiles) {
        const dtsFile = jsFile.replace(/\.js$/, '.d.ts')
        if (!existsSync(join(dir, dtsFile))) {
          errors.push(
            `missing declaration file '${dtsFile}' in wildcard directory '${value}'`
          )
        }
      }
    }
  })

  // Check "types" field
  if (pkg.types) {
    const resolved = join(pkgDir, pkg.types)
    if (!existsSync(resolved)) {
      errors.push(`types file '${pkg.types}' not found at '${resolved}'`)
    }
  }

  return errors
}

function main(args: Args): void {
  const pkgDir = args._[0]
  if (!pkgDir) {
    console.error('Usage: check_package_exports <pkg-dir>')
    process.exit(1)
  }

  const errors = validatePackageExports(pkgDir)
  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`FAIL: ${err}`)
    }
    process.exit(1)
  }

  console.log('PASS: all package.json exports exist in package')
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
