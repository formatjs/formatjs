import {existsSync, readFileSync} from 'fs'
import {join} from 'path'
import minimist from 'minimist'
import {valid} from 'semver'

interface Args extends minimist.ParsedArgs {
  dist?: string
  package?: string | string[]
}

interface PackageJson {
  name?: unknown
  version?: unknown
  dependencies?: unknown
  peerDependencies?: unknown
  optionalDependencies?: unknown
}

const DEPENDENCY_FIELDS = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
] as const

function parsePackageArg(value: string): [string, string] {
  const separator = value.indexOf('=')
  if (separator === -1) {
    throw new Error(
      `package arg must be '<package-dir>=<package-json>': ${value}`
    )
  }
  return [value.slice(0, separator), value.slice(separator + 1)]
}

function readPackageJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, 'utf8')) as PackageJson
}

function dependencyEntries(
  packageJson: PackageJson,
  field: (typeof DEPENDENCY_FIELDS)[number],
  path: string,
  errors: string[]
): Array<[string, string]> {
  const dependencies = packageJson[field]
  if (dependencies === undefined) {
    return []
  }
  if (
    !dependencies ||
    typeof dependencies !== 'object' ||
    Array.isArray(dependencies)
  ) {
    errors.push(`${path} ${field} must be an object`)
    return []
  }

  const entries: Array<[string, string]> = []
  for (const [packageName, version] of Object.entries(dependencies)) {
    if (typeof version !== 'string') {
      errors.push(`${path} ${field}.${packageName} must be a string`)
      continue
    }
    entries.push([packageName, version])
  }
  return entries
}

function main(args: Args): void {
  if (!args.dist) {
    console.error(
      'Usage: check_dist_package_json --dist <dist-dir> --package <package-dir>=<package-json>...'
    )
    process.exit(1)
  }

  const packageArgs = Array.isArray(args.package)
    ? args.package
    : args.package
      ? [args.package]
      : []
  if (packageArgs.length === 0) {
    console.error('FAIL: at least one --package must be provided')
    process.exit(1)
  }

  const errors: string[] = []
  const packageJsons: Array<{
    actualPath: string
    actualJson: PackageJson
  }> = []
  const workspacePackageNames = new Set<string>()

  for (const packageArg of packageArgs) {
    const [packageDir, expectedPath] = parsePackageArg(packageArg)
    const actualPath = join(args.dist, 'packages', packageDir, 'package.json')
    const errorCountBefore = errors.length

    for (const path of [actualPath, expectedPath]) {
      if (!existsSync(path)) {
        errors.push(`${path} does not exist`)
        continue
      }
      try {
        readPackageJson(path)
      } catch (err) {
        errors.push(`${path} is not valid JSON: ${(err as Error).message}`)
      }
    }
    if (errors.length > errorCountBefore) continue

    const actualJson = readPackageJson(actualPath)
    const actual = readFileSync(actualPath, 'utf8')
    const expected = readFileSync(expectedPath, 'utf8')
    if (actual !== expected) {
      errors.push(
        `${actualPath} does not match generated manifest ${expectedPath}`
      )
    }

    if (typeof actualJson.name === 'string') {
      workspacePackageNames.add(actualJson.name)
    }
    packageJsons.push({
      actualPath,
      actualJson,
    })
  }

  for (const {actualPath, actualJson} of packageJsons) {
    if (
      typeof actualJson.version !== 'string' ||
      valid(actualJson.version) === null
    ) {
      errors.push(`${actualPath} version must be valid semver`)
    }

    for (const field of DEPENDENCY_FIELDS) {
      for (const [packageName, version] of dependencyEntries(
        actualJson,
        field,
        actualPath,
        errors
      )) {
        if (
          workspacePackageNames.has(packageName) &&
          version !== 'workspace:*'
        ) {
          errors.push(
            `${actualPath} ${field}.${packageName} must use workspace:*`
          )
        }
      }
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`FAIL: ${error}`)
    }
    process.exit(1)
  }

  console.log('PASS: dist package.json files match generated manifests')
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
