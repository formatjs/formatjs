import {createRequire} from 'node:module'

import {buildDependencyGraph, readGraph} from './npm-workspace-graph.ts'

const require = createRequire(import.meta.url)

// Load the public entrypoint first so release-please initializes its built-in
// plugin graph before we deep-import the workspace base class below.
require('release-please')

const {
  WorkspacePlugin,
  appendDependenciesSectionToChangelog,
} = require('release-please/build/src/plugins/workspace')
const {Version} = require('release-please/build/src/version')
const {
  PatchVersionUpdate,
} = require('release-please/build/src/versioning-strategy')
const {Changelog} = require('release-please/build/src/updaters/changelog')
const {
  CompositeUpdater,
} = require('release-please/build/src/updaters/composite')
const {
  newVersionWithRange,
} = require('release-please/build/src/updaters/node/package-json')

const DEPENDENCY_NOTE_FIELDS = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
]

function packageDeps(pkg, field: string) {
  return pkg[field] || {}
}

function getChangelogDepsNotes(original, updated, updatedVersions, logger) {
  let dependencyNotes = ''
  const updates = new Map()

  for (const depType of DEPENDENCY_NOTE_FIELDS) {
    const depUpdates = []
    for (const [depName, currentDepVersion] of Object.entries(
      packageDeps(updated, depType)
    )) {
      const newVersion = updatedVersions.get(depName)
      if (!newVersion) {
        logger.debug(`${depName} was not bumped, ignoring`)
        continue
      }

      const originalDepVersion = packageDeps(original, depType)[depName]
      const newVersionString = newVersionWithRange(
        originalDepVersion,
        newVersion
      )
      if (currentDepVersion.startsWith('workspace:')) {
        depUpdates.push(`\n    * ${depName} bumped to ${newVersionString}`)
      } else if (newVersionString !== originalDepVersion) {
        depUpdates.push(
          `\n    * ${depName} bumped from ${originalDepVersion} to ${newVersionString}`
        )
      }
    }

    if (depUpdates.length > 0) {
      updates.set(depType, depUpdates)
    }
  }

  for (const [depType, notes] of updates) {
    dependencyNotes += `\n  * ${depType}`
    for (const note of notes) {
      dependencyNotes += note
    }
  }

  return dependencyNotes
    ? `* The following workspace dependencies were updated${dependencyNotes}`
    : ''
}

function appendChangelogNotes(updater, notes: string, logger) {
  if (updater instanceof Changelog) {
    updater.changelogEntry = appendDependenciesSectionToChangelog(
      updater.changelogEntry,
      notes,
      logger
    )
    return true
  }

  if (updater instanceof CompositeUpdater) {
    return updater.updaters.some(child =>
      appendChangelogNotes(child, notes, logger)
    )
  }

  return false
}

export class BazelNpmWorkspace extends WorkspacePlugin {
  constructor(github, targetBranch, repositoryConfig, options = {}) {
    super(github, targetBranch, repositoryConfig, options)
    this.graphPath =
      options.graphPath ||
      process.env.FORMATJS_RELEASE_PLEASE_NPM_WORKSPACE_GRAPH
    this.includePeerDependencies =
      options.includePeerDependencies === true ||
      process.env.FORMATJS_RELEASE_PLEASE_NPM_WORKSPACE_INCLUDE_PEERS === 'true'
    this.strategiesByPath = {}
    this.releasesByPath = {}
  }

  async buildAllPackages(candidates) {
    if (!this.graphPath) {
      throw new Error(
        'FORMATJS_RELEASE_PLEASE_NPM_WORKSPACE_GRAPH must point to the generated workspace graph'
      )
    }

    const configuredPaths = Object.entries(this.repositoryConfig)
      .filter(
        ([path, config]) =>
          path.startsWith('packages/') && config.releaseType === 'bazel'
      )
      .map(([path]) => path)
    const packagesByPath = new Map()

    for (const pkg of readGraph(this.graphPath).packages) {
      if (packagesByPath.has(pkg.path)) {
        throw new Error(`duplicate workspace package path: ${pkg.path}`)
      }
      packagesByPath.set(pkg.path, pkg)
    }

    const allPackages = configuredPaths.map(path => {
      const pkg = packagesByPath.get(path)
      if (!pkg) {
        throw new Error(
          `Release Please package ${path} is missing from ${this.graphPath}`
        )
      }
      return pkg
    })

    const candidatesByPath = new Map(
      candidates.map(candidate => [candidate.path, candidate])
    )
    const candidatesByPackage = {}

    for (const candidate of candidates) {
      if (!this.inScope(candidate)) {
        continue
      }
      const pkg = packagesByPath.get(candidate.path)
      if (!pkg) {
        throw new Error(
          `Release Please candidate ${candidate.path} is missing from ${this.graphPath}`
        )
      }
      candidatesByPackage[pkg.name] = candidate
    }

    for (const path of configuredPaths) {
      if (candidatesByPath.has(path)) {
        this.logger.debug(`Found candidate pull request for path: ${path}`)
      }
    }

    return {allPackages, candidatesByPackage}
  }

  async buildGraph(allPackages) {
    return buildDependencyGraph(allPackages, {
      includePeerDependencies: this.includePeerDependencies,
    })
  }

  bumpVersion(pkg) {
    const version = Version.parse(pkg.version)
    const strategy = this.strategiesByPath[pkg.path]
    if (strategy) {
      return strategy.versioningStrategy.bump(version, [])
    }
    return new PatchVersionUpdate().bump(version)
  }

  updateCandidate(existingCandidate, pkg, updatedVersions) {
    const newVersion = updatedVersions.get(pkg.name)
    if (!newVersion) {
      throw new Error(`Didn't find updated version for ${pkg.name}`)
    }

    const updatedPackage = {
      ...pkg,
      version: newVersion.toString(),
    }
    const dependencyNotes = getChangelogDepsNotes(
      pkg,
      updatedPackage,
      updatedVersions,
      this.logger
    )

    if (!dependencyNotes) {
      return existingCandidate
    }

    existingCandidate.pullRequest.updates =
      existingCandidate.pullRequest.updates.map(update => {
        appendChangelogNotes(update.updater, dependencyNotes, this.logger)
        return update
      })

    if (existingCandidate.pullRequest.body.releaseData.length > 0) {
      existingCandidate.pullRequest.body.releaseData[0].notes =
        appendDependenciesSectionToChangelog(
          existingCandidate.pullRequest.body.releaseData[0].notes,
          dependencyNotes,
          this.logger
        )
    } else {
      existingCandidate.pullRequest.body.releaseData.push({
        component: updatedPackage.name,
        version: newVersion,
        notes: appendDependenciesSectionToChangelog(
          '',
          dependencyNotes,
          this.logger
        ),
      })
    }

    return existingCandidate
  }

  async newCandidate(pkg, updatedVersions) {
    const newVersion = updatedVersions.get(pkg.name)
    if (!newVersion) {
      throw new Error(`Didn't find updated version for ${pkg.name}`)
    }

    const strategy = this.strategiesByPath[pkg.path]
    if (!strategy) {
      throw new Error(`No Release Please strategy found for ${pkg.path}`)
    }

    const basePullRequest = await strategy.buildReleasePullRequest(
      [],
      this.releasesByPath[pkg.path],
      false,
      [],
      {newVersion}
    )
    if (!basePullRequest) {
      throw new Error(`Could not build dependency bump for ${pkg.path}`)
    }

    return this.updateCandidate(
      {
        path: pkg.path,
        pullRequest: basePullRequest,
        config: this.repositoryConfig[pkg.path],
      },
      pkg,
      updatedVersions
    )
  }

  postProcessCandidates(candidates) {
    return candidates
  }

  inScope(candidate) {
    return (
      candidate.path.startsWith('packages/') &&
      candidate.config.releaseType === 'bazel'
    )
  }

  packageNameFromPackage(pkg) {
    return pkg.name
  }

  pathFromPackage(pkg) {
    return pkg.path
  }

  async preconfigure(strategiesByPath, _commitsByPath, releasesByPath) {
    this.strategiesByPath = strategiesByPath
    this.releasesByPath = releasesByPath
    return strategiesByPath
  }
}
