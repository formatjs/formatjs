import {readFileSync, readdirSync, statSync} from 'fs'
import {join} from 'path'
import {builtinModules} from 'module'
import minimist from 'minimist'
import {parseSync} from 'oxc-parser'

interface Args extends minimist.ParsedArgs {
  pkg: string
  bundle?: string | string[]
}

const NODE_BUILTINS = new Set(builtinModules)

function bareSpecifier(spec: string): string | undefined {
  if (spec.startsWith('.') || spec.startsWith('/')) return
  if (spec.startsWith('node:')) return
  if (NODE_BUILTINS.has(spec)) return
  const parts = spec.split('/')
  if (spec.startsWith('@')) {
    if (parts.length < 2) return
    return parts.slice(0, 2).join('/')
  }
  return parts[0]
}

function checkBundle(
  bundlePath: string,
  declared: Set<string>,
  errors: string[]
): void {
  const stat = statSync(bundlePath, {throwIfNoEntry: false})
  if (!stat) return
  if (stat.isFile()) {
    if (!bundlePath.endsWith('.js')) return
    const content = readFileSync(bundlePath, 'utf8')
    const result = parseSync(bundlePath, content, {sourceType: 'module'})
    const seen = new Set<string>()
    const specs = [
      ...result.module.staticImports.map(i => i.moduleRequest.value),
      ...result.module.staticExports.flatMap(e =>
        e.entries
          .map(entry => entry.moduleRequest?.value)
          .filter((v): v is string => Boolean(v))
      ),
      ...result.module.dynamicImports.flatMap(i => {
        const raw = content.slice(i.moduleRequest.start, i.moduleRequest.end)
        const m = /^(['"])([^'"]+)\1$/.exec(raw)
        return m ? [m[2]] : []
      }),
    ]
    for (const spec of specs) {
      const bare = bareSpecifier(spec)
      if (!bare || seen.has(bare)) continue
      seen.add(bare)
      if (!declared.has(bare)) {
        errors.push(
          `'${bare}' imported by ${bundlePath} but not declared in package.json (dependencies/peerDependencies)`
        )
      }
    }
    return
  }
  if (stat.isDirectory()) {
    for (const entry of readdirSync(bundlePath)) {
      checkBundle(join(bundlePath, entry), declared, errors)
    }
  }
}

function main(args: Args): void {
  if (!args.pkg) {
    console.error(
      'Usage: check_package_json --pkg <package.json> --bundle <path>...'
    )
    process.exit(1)
  }
  const bundles = Array.isArray(args.bundle)
    ? args.bundle
    : args.bundle
      ? [args.bundle]
      : []
  if (bundles.length === 0) {
    console.error('FAIL: at least one --bundle must be provided')
    process.exit(1)
  }

  const pkg = JSON.parse(readFileSync(args.pkg, 'utf8'))
  const declared = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ])

  const errors: string[] = []
  for (const bundle of bundles) {
    checkBundle(bundle, declared, errors)
  }

  if (errors.length > 0) {
    for (const err of errors) console.error(`FAIL: ${err}`)
    process.exit(1)
  }

  console.log('PASS: all bundle imports are declared in package.json')
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
