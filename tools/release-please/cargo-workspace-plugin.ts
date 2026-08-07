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

export function filterPublishableCrates({
  allPackages,
  candidatesByPackage,
}: CargoWorkspacePackages): CargoWorkspacePackages {
  const publishablePackages = allPackages.filter(
    pkg => pkg.manifest.package?.publish !== false
  )
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

export function createCargoWorkspacePlugin(CargoWorkspace: any) {
  return class FormatjsCargoWorkspace extends CargoWorkspace {
    async buildAllPackages(candidates: unknown[]) {
      return filterPublishableCrates(await super.buildAllPackages(candidates))
    }
  }
}
