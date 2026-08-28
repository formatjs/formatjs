interface CargoPackage {
  name: string
  manifest: {
    package?: {
      publish?: unknown
    }
  }
}

interface CargoWorkspacePackages {
  allPackages: CargoPackage[]
  candidatesByPackage: Record<string, unknown>
}

interface WorkspacePluginOptions extends Record<string, unknown> {
  merge?: boolean
  separatePullRequests?: boolean
  type?: unknown
}

export function filterReleaseCrates({
  allPackages,
  candidatesByPackage,
}: CargoWorkspacePackages): CargoWorkspacePackages {
  const candidateNames = new Set(Object.keys(candidatesByPackage))
  const releasePackages = allPackages.filter(pkg => {
    const publish = pkg.manifest.package?.publish
    // Explicit candidates may release binaries without publishing a crate.
    return (
      candidateNames.has(pkg.name) ||
      (publish !== false && !(Array.isArray(publish) && publish.length === 0))
    )
  })
  const releaseNames = new Set(releasePackages.map(pkg => pkg.name))

  return {
    allPackages: releasePackages,
    candidatesByPackage: Object.fromEntries(
      Object.entries(candidatesByPackage).filter(([name]) =>
        releaseNames.has(name)
      )
    ),
  }
}

export function resolveWorkspacePluginOptions(
  options: WorkspacePluginOptions
): WorkspacePluginOptions {
  const typeOptions =
    options.type && typeof options.type === 'object'
      ? (options.type as Record<string, unknown>)
      : {}

  return {
    ...options,
    ...typeOptions,
    merge:
      (typeOptions.merge as boolean | undefined) ??
      options.merge ??
      !options.separatePullRequests,
  }
}

export function createCargoWorkspacePlugin(CargoWorkspace: any) {
  return class FormatjsCargoWorkspace extends CargoWorkspace {
    async buildAllPackages(candidates: unknown[]) {
      return filterReleaseCrates(await super.buildAllPackages(candidates))
    }
  }
}
