import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'

import minimist from 'minimist'

interface Args extends minimist.ParsedArgs {
  'root-package-json'?: string
  metadata?: string
  out?: string
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {[key: string]: JsonValue}

type JsonObject = {[key: string]: JsonValue}

export interface PackageJsonMetadata {
  fields: JsonObject
  dependencies?: string[]
  devDependencies?: string[]
  peerDependencies?: string[]
  optionalDependencies?: string[]
  dependencyVersionOverrides?: Record<string, string>
  sortExports?: string[]
  sortFirst?: string[]
}

const DEPENDENCY_FIELDS = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
] as const

const ROOT_VERSION_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const

const REPOSITORY_SORT_FIRST = ['type', 'url', 'directory']

function sortedUnique(values: string[] | undefined): string[] {
  return [...new Set(values ?? [])].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

function rootVersionMap(rootPackageJson: JsonObject): Map<string, string> {
  const versions = new Map<string, string>()
  for (const field of ROOT_VERSION_FIELDS) {
    const deps = rootPackageJson[field]
    if (!deps || typeof deps !== 'object' || Array.isArray(deps)) {
      continue
    }
    for (const [packageName, version] of Object.entries(deps)) {
      if (typeof version !== 'string' || versions.has(packageName)) {
        continue
      }
      versions.set(packageName, version)
    }
  }
  return versions
}

function rootDependencyVersion(
  packageName: string,
  versions: Map<string, string>
): string {
  const version = versions.get(packageName)
  if (!version) {
    throw new Error(
      `No version found for ${packageName}; add it to the root package.json`
    )
  }
  return version
}

function dependencyVersion(
  packageName: string,
  metadata: PackageJsonMetadata,
  rootVersions: Map<string, string>
): string {
  const overrideVersion = metadata.dependencyVersionOverrides?.[packageName]
  if (overrideVersion) {
    return overrideVersion
  }

  return rootDependencyVersion(packageName, rootVersions)
}

function dependencyNameSet(metadata: PackageJsonMetadata): Set<string> {
  const names = new Set<string>()
  for (const field of DEPENDENCY_FIELDS) {
    for (const packageName of metadata[field] ?? []) {
      names.add(packageName)
    }
  }
  return names
}

function validateDependencyVersionOverrides(
  metadata: PackageJsonMetadata
): void {
  const overrideNames = Object.keys(metadata.dependencyVersionOverrides ?? {})
  if (overrideNames.length === 0) {
    return
  }

  const dependencyNames = dependencyNameSet(metadata)
  const unused = overrideNames
    .filter(packageName => !dependencyNames.has(packageName))
    .sort()
  if (unused.length === 0) {
    return
  }

  throw new Error(
    `dependencyVersionOverrides contains unused override(s): ${unused.join(', ')}`
  )
}

function validateNoDevDependencies(metadata: PackageJsonMetadata): void {
  if ((metadata.devDependencies ?? []).length === 0) {
    return
  }

  throw new Error(
    'devDependencies must live in the root package.json, not package manifests'
  )
}

function orderObjectByKeys(
  object: JsonObject,
  keysFirst: string[]
): JsonObject {
  const result: JsonObject = {}
  const seen = new Set<string>()

  for (const key of keysFirst) {
    if (Object.hasOwn(object, key)) {
      result[key] = object[key]
      seen.add(key)
    }
  }

  for (const key of Object.keys(object)
    .filter(key => !seen.has(key))
    .sort()) {
    result[key] = object[key]
  }

  return result
}

function orderExports(value: JsonValue, sortExports: string[]): JsonValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  const object = value as JsonObject
  const keys = Object.keys(object)
  if (keys.some(key => sortExports.includes(key))) {
    return orderObjectByKeys(object, sortExports)
  }

  const result: JsonObject = {}
  for (const key of keys.sort((left, right) => {
    if (left === '.') {
      return right === '.' ? 0 : -1
    }
    if (right === '.') {
      return 1
    }
    return left < right ? -1 : left > right ? 1 : 0
  })) {
    const child = object[key]
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      result[key] = orderExports(child, sortExports)
      continue
    }

    result[key] = child
  }

  return result
}

function dependencyObject(
  packageNames: string[] | undefined,
  metadata: PackageJsonMetadata,
  rootVersions: Map<string, string>
): Record<string, string> | undefined {
  const sorted = sortedUnique(packageNames)
  if (sorted.length === 0) {
    return
  }

  const result: Record<string, string> = {}
  for (const packageName of sorted) {
    result[packageName] = dependencyVersion(packageName, metadata, rootVersions)
  }
  return result
}

function orderedStringArray(value: JsonValue): JsonValue {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
    return value
  }
  return [...value].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0
  )
}

export function generatePackageJson(
  metadata: PackageJsonMetadata,
  rootPackageJson: JsonObject
): JsonObject {
  if (metadata.fields.gitHead !== undefined) {
    throw new Error(
      'gitHead must not be set in generated package.json metadata'
    )
  }

  for (const field of ROOT_VERSION_FIELDS) {
    if (metadata.fields[field] !== undefined) {
      throw new Error(
        `${field} must be generated from Bazel labels, not static fields`
      )
    }
  }
  validateNoDevDependencies(metadata)
  validateDependencyVersionOverrides(metadata)

  const rootVersions = rootVersionMap(rootPackageJson)
  const result: JsonObject = {...metadata.fields}

  for (const field of DEPENDENCY_FIELDS) {
    const deps = dependencyObject(metadata[field], metadata, rootVersions)
    if (deps) {
      result[field] = deps
    }
  }

  if (metadata.sortExports && result.exports) {
    result.exports = orderExports(result.exports, metadata.sortExports)
  }

  if (result.keywords) {
    result.keywords = orderedStringArray(result.keywords)
  }

  if (
    result.repository &&
    typeof result.repository === 'object' &&
    !Array.isArray(result.repository)
  ) {
    result.repository = orderObjectByKeys(
      result.repository as JsonObject,
      REPOSITORY_SORT_FIRST
    )
  }

  return orderObjectByKeys(result, metadata.sortFirst ?? [])
}

function requiredArg(args: Args, name: keyof Args): string {
  const value = args[name]
  if (typeof value !== 'string' || !value) {
    throw new Error(`--${String(name)} is required`)
  }
  return value
}

function main(args: Args): void {
  const rootPackageJsonPath = requiredArg(args, 'root-package-json')
  const metadataPath = requiredArg(args, 'metadata')
  const outPath = requiredArg(args, 'out')

  const rootPackageJson = JSON.parse(
    readFileSync(rootPackageJsonPath, 'utf8')
  ) as JsonObject
  const metadata = JSON.parse(
    readFileSync(metadataPath, 'utf8')
  ) as PackageJsonMetadata

  const generated = generatePackageJson(metadata, rootPackageJson)
  mkdirSync(dirname(outPath), {recursive: true})
  writeFileSync(outPath, `${JSON.stringify(generated, null, 2)}\n`)
}

if (import.meta.filename === process.argv[1]) {
  main(minimist<Args>(process.argv.slice(2)))
}
