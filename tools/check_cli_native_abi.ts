import {existsSync, readFileSync} from 'fs'
import {basename, dirname, relative} from 'path'
import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  'central-abi'?: string
  'rust-lib'?: string
  'package-abi'?: string | string[]
  'package-json'?: string | string[]
  'release-config'?: string
}

interface NativeAbi {
  version: number
  exports: string[]
}

interface PackageMarker {
  abiPath: string
  packageJsonPath: string
}

interface ValidateNativeAbiOptions {
  centralAbiPath: string
  rustLibPath: string
  packageMarkers: PackageMarker[]
  releaseConfigPath?: string
}

function asArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function snakeToCamel(name: string): string {
  return name.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}

function normalizeAbi(abi: NativeAbi): NativeAbi {
  return {
    version: abi.version,
    exports: [...abi.exports].sort(),
  }
}

function formatList(items: string[]): string {
  return items.length ? items.join(', ') : '<none>'
}

function diffLists(expected: string[], actual: string[]): string[] {
  const expectedSet = new Set(expected)
  const actualSet = new Set(actual)
  const missing = expected.filter(item => !actualSet.has(item))
  const extra = actual.filter(item => !expectedSet.has(item))
  const errors: string[] = []

  if (missing.length) {
    errors.push(`missing: ${formatList(missing)}`)
  }
  if (extra.length) {
    errors.push(`extra: ${formatList(extra)}`)
  }

  return errors
}

export function collectRustNapiExports(source: string): string[] {
  const exports = new Set<string>()
  const napiFnPattern =
    /#\s*\[\s*napi(?:\([^)]*\))?\s*\]\s*(?:#\s*\[[^\]]+\]\s*)*pub\s+fn\s+([A-Za-z0-9_]+)\s*\(/g

  for (
    let match = napiFnPattern.exec(source);
    match;
    match = napiFnPattern.exec(source)
  ) {
    exports.add(snakeToCamel(match[1]))
  }

  return [...exports].sort()
}

export function validateNativeAbi({
  centralAbiPath,
  rustLibPath,
  packageMarkers,
  releaseConfigPath,
}: ValidateNativeAbiOptions): string[] {
  const errors: string[] = []

  if (!existsSync(centralAbiPath)) {
    return [`central native ABI marker not found: ${centralAbiPath}`]
  }
  if (!existsSync(rustLibPath)) {
    return [`Rust N-API source not found: ${rustLibPath}`]
  }

  const centralAbi = normalizeAbi(readJson<NativeAbi>(centralAbiPath))
  if (!Number.isInteger(centralAbi.version) || centralAbi.version < 1) {
    errors.push(`${centralAbiPath} must define a positive integer ABI version`)
  }

  const duplicateExports = centralAbi.exports.filter(
    (name, index) => centralAbi.exports.indexOf(name) !== index
  )
  if (duplicateExports.length) {
    errors.push(
      `${centralAbiPath} has duplicate exports: ${formatList(duplicateExports)}`
    )
  }

  const rustExports = collectRustNapiExports(readFileSync(rustLibPath, 'utf8'))
  const exportDiffs = diffLists(centralAbi.exports, rustExports)
  if (exportDiffs.length) {
    errors.push(
      `${centralAbiPath} does not match Rust #[napi] exports in ${rustLibPath}: ${exportDiffs.join('; ')}`
    )
  }

  const releaseConfig = releaseConfigPath
    ? readJson<{packages?: Record<string, unknown>}>(releaseConfigPath)
    : undefined

  for (const {abiPath, packageJsonPath} of packageMarkers) {
    if (!existsSync(abiPath)) {
      errors.push(`package native ABI marker not found: ${abiPath}`)
      continue
    }
    if (!existsSync(packageJsonPath)) {
      errors.push(
        `package.json not found for native ABI marker: ${packageJsonPath}`
      )
      continue
    }

    const packageAbi = normalizeAbi(readJson<NativeAbi>(abiPath))
    const packageJson = readJson<{name?: string; files?: string[]}>(
      packageJsonPath
    )
    const packageName = packageJson.name ?? packageJsonPath
    const packageDir = dirname(packageJsonPath)
    const markerName = basename(abiPath)

    if (JSON.stringify(packageAbi) !== JSON.stringify(centralAbi)) {
      errors.push(
        `${packageName} native ABI marker must match ${centralAbiPath}`
      )
    }

    if (!packageJson.files?.includes(markerName)) {
      errors.push(
        `${packageName} package.json files must include ${markerName}`
      )
    }

    if (releaseConfig) {
      const releasePath = relative(dirname(releaseConfigPath!), packageDir)
      if (!releaseConfig.packages?.[releasePath]) {
        errors.push(
          `${packageName} must be configured as a Release Please package at ${releasePath}`
        )
      }
    }
  }

  return errors
}

function main(args: Args): void {
  const centralAbiPath = args['central-abi']
  const rustLibPath = args['rust-lib']
  const packageAbiPaths = asArray(args['package-abi'])
  const packageJsonPaths = asArray(args['package-json'])

  if (!centralAbiPath || !rustLibPath || packageAbiPaths.length === 0) {
    console.error(
      'Usage: check_cli_native_abi --central-abi <path> --rust-lib <path> --package-abi <path> --package-json <path>...'
    )
    process.exit(1)
  }

  if (packageAbiPaths.length !== packageJsonPaths.length) {
    console.error(
      `Expected matching --package-abi and --package-json counts, got ${packageAbiPaths.length} and ${packageJsonPaths.length}`
    )
    process.exit(1)
  }

  const errors = validateNativeAbi({
    centralAbiPath,
    rustLibPath,
    releaseConfigPath: args['release-config'],
    packageMarkers: packageAbiPaths.map((abiPath, index) => ({
      abiPath,
      packageJsonPath: packageJsonPaths[index],
    })),
  })

  if (errors.length) {
    for (const error of errors) {
      console.error(`FAIL: ${error}`)
    }
    process.exit(1)
  }

  console.log('PASS: CLI native ABI markers match Rust exports')
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
