export type ReleaseManifest = Record<string, string>

export interface NpmPackage {
  name: string
  version: string
  private?: boolean
  dependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

type VersionPublished = (name: string, version: string) => Promise<boolean>
const dependencyFields = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
] as const

export async function isNpmVersionPublished(
  name: string,
  version: string,
  fetchRegistry: typeof fetch = fetch
): Promise<boolean> {
  const response = await fetchRegistry(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
    {signal: AbortSignal.timeout(30_000), cache: 'no-store'}
  )
  if (response.status === 404) {
    return false
  }
  if (!response.ok) {
    throw new Error(
      `npm registry returned ${response.status} for ${name}@${version}`
    )
  }
  const manifest = await response.json()
  if (manifest.name !== name || manifest.version !== version) {
    throw new Error(`Unexpected npm registry response for ${name}@${version}`)
  }
  return true
}

export async function collectNpmReleasePaths(
  currentManifest: ReleaseManifest,
  packages: Record<string, NpmPackage>,
  isPublished: VersionPublished = isNpmVersionPublished
): Promise<string[]> {
  const missing: string[] = []
  for (const [path, version] of Object.entries(currentManifest)) {
    if (!path.startsWith('packages/')) {
      continue
    }
    const pkg = packages[path]
    if (!pkg) {
      throw new Error(`Missing release package manifest: ${path}`)
    }
    if (pkg.private) {
      continue
    }
    if (pkg.version !== version) {
      throw new Error(
        `Release version mismatch for ${path}: ${version} != ${pkg.version}`
      )
    }
    if (!(await isPublished(pkg.name, version))) {
      missing.push(path)
    }
  }
  return orderNpmReleasePaths(missing, packages)
}

export function orderNpmReleasePaths(
  paths: string[],
  packages: Record<string, NpmPackage>
): string[] {
  const byName = new Map(
    Object.entries(packages).map(([path, pkg]) => [pkg.name, path])
  )
  const selected = new Set(paths)
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const ordered: string[] = []
  function visit(path: string) {
    if (visited.has(path)) {
      return
    }
    if (visiting.has(path)) {
      throw new Error(`Circular npm release dependency: ${path}`)
    }
    const pkg = packages[path]
    if (!pkg || pkg.private) {
      throw new Error(`Invalid npm release package: ${path}`)
    }
    visiting.add(path)
    for (const field of dependencyFields) {
      for (const name of Object.keys(pkg[field] || {})) {
        const dependencyPath = byName.get(name)
        if (dependencyPath && selected.has(dependencyPath)) {
          visit(dependencyPath)
        }
      }
    }
    visiting.delete(path)
    visited.add(path)
    ordered.push(path)
  }
  paths.forEach(visit)
  return ordered
}

export async function publishNpmPackages(
  paths: string[],
  packages: Record<string, NpmPackage>,
  publish: (path: string) => Promise<void>,
  isPublished: VersionPublished = isNpmVersionPublished,
  wait: (milliseconds: number) => Promise<void> = milliseconds =>
    new Promise(resolve => setTimeout(resolve, milliseconds))
): Promise<void> {
  const names = new Set(Object.values(packages).map(pkg => pkg.name))
  for (const path of orderNpmReleasePaths(paths, packages)) {
    const pkg = packages[path]
    if (await isPublished(pkg.name, pkg.version)) {
      continue
    }
    for (const field of dependencyFields) {
      for (const [name, version] of Object.entries(pkg[field] || {})) {
        if (names.has(name) && !(await isPublished(name, version))) {
          throw new Error(
            `Cannot publish ${pkg.name}@${pkg.version}: missing ${name}@${version}`
          )
        }
      }
    }
    let publishError: unknown
    try {
      await publish(path)
    } catch (error) {
      // Another release may have published this version concurrently.
      publishError = error
    }
    for (let attempt = 0; attempt < 36; attempt++) {
      if (await isPublished(pkg.name, pkg.version)) {
        break
      }
      if (attempt === 35) {
        throw (
          publishError ||
          new Error(`npm publication not visible: ${pkg.name}@${pkg.version}`)
        )
      }
      await wait(5_000)
    }
  }
}
