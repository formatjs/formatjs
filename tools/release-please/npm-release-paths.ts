export type ReleaseManifest = Record<string, string>

export function collectNpmReleasePaths(
  previousManifest: ReleaseManifest,
  currentManifest: ReleaseManifest,
  pathsReleased: string[]
): string[] {
  const npmPaths = new Set(
    pathsReleased.filter(path => path.startsWith('packages/'))
  )

  for (const [path, version] of Object.entries(currentManifest)) {
    if (path.startsWith('packages/') && previousManifest[path] !== version) {
      npmPaths.add(path)
    }
  }

  return [...npmPaths]
}
