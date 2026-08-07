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

export function filterPublishableCrates({
  allPackages,
  candidatesByPackage,
}: CargoWorkspacePackages): CargoWorkspacePackages {
  const publishablePackages = allPackages.filter(pkg => {
    const publish = pkg.manifest.package?.publish
    return (
      publish !== false && !(Array.isArray(publish) && publish.length === 0)
    )
  })
  const publishableNames = new Set(publishablePackages.map(pkg => pkg.name))

  return {
    allPackages: publishablePackages,
    candidatesByPackage: Object.fromEntries(
      Object.entries(candidatesByPackage).filter(([name]) =>
        publishableNames.has(name)
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
      return filterPublishableCrates(await super.buildAllPackages(candidates))
    }
  }
}
