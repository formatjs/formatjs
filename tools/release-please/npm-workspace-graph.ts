import {readFileSync} from 'node:fs'

const DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies'] as const
const PEER_DEPENDENCY_FIELDS = ['peerDependencies'] as const

type DependencyField =
  | (typeof DEPENDENCY_FIELDS)[number]
  | (typeof PEER_DEPENDENCY_FIELDS)[number]

type DependencyMap = Record<string, string>

export interface WorkspacePackage {
  path: string
  name: string
  version: string
  dependencies: DependencyMap
  optionalDependencies: DependencyMap
  peerDependencies: DependencyMap
  releaseDependencies: string[]
}

interface WorkspaceGraphFile {
  packages: WorkspacePackage[]
}

interface DependencyGraphNode {
  deps: string[]
  value: WorkspacePackage
}

export type DependencyGraph = Map<string, DependencyGraphNode>

interface GraphOptions {
  includePeerDependencies?: boolean
}

type PackageWithDependencies = Partial<Record<DependencyField, DependencyMap>>

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function dependencyMap(value: unknown): DependencyMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
  )
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((entry): entry is string => typeof entry === 'string')
}

export function normalizePackage(pkg: unknown): WorkspacePackage {
  if (!pkg || typeof pkg !== 'object') {
    throw new Error('workspace package entry must be an object')
  }
  const rawPackage = pkg as Record<string, unknown>
  for (const field of ['path', 'name', 'version']) {
    if (typeof rawPackage[field] !== 'string' || rawPackage[field] === '') {
      throw new Error(`workspace package entry missing ${field}`)
    }
  }
  return {
    path: rawPackage.path as string,
    name: rawPackage.name as string,
    version: rawPackage.version as string,
    dependencies: dependencyMap(rawPackage.dependencies),
    optionalDependencies: dependencyMap(rawPackage.optionalDependencies),
    peerDependencies: dependencyMap(rawPackage.peerDependencies),
    releaseDependencies: stringArray(rawPackage.releaseDependencies),
  }
}

export function readGraph(path: string): WorkspaceGraphFile {
  const graph = readJsonFile(path)
  if (
    !graph ||
    typeof graph !== 'object' ||
    !Array.isArray((graph as {packages?: unknown}).packages)
  ) {
    throw new Error(`${path} must contain a packages array`)
  }
  return {
    packages: (graph as {packages: unknown[]}).packages.map(normalizePackage),
  }
}

export function dependencyNames(
  pkg: PackageWithDependencies,
  options: GraphOptions = {}
): string[] {
  const fields = options.includePeerDependencies
    ? DEPENDENCY_FIELDS.concat(PEER_DEPENDENCY_FIELDS)
    : DEPENDENCY_FIELDS
  const names = new Set()
  for (const field of fields) {
    for (const name of Object.keys(dependencyMap(pkg[field]))) {
      names.add(name)
    }
  }
  return [...names].sort()
}

export function buildDependencyGraph(
  packages: unknown[],
  options: GraphOptions = {}
): DependencyGraph {
  const normalized = packages.map(normalizePackage)
  const workspaceNames = new Set(normalized.map(pkg => pkg.name))
  const graph: DependencyGraph = new Map()

  for (const pkg of normalized) {
    if (graph.has(pkg.name)) {
      throw new Error(`duplicate workspace package name: ${pkg.name}`)
    }
    graph.set(pkg.name, {
      deps: dependencyNames(pkg, options).filter(name =>
        workspaceNames.has(name)
      ),
      value: pkg,
    })
  }

  return graph
}

export function packageNamesWithReleaseDependencies(
  graph: DependencyGraph,
  releasePaths: Set<string>
): string[] {
  const packageNames = []
  for (const {value: pkg} of graph.values()) {
    if (pkg.releaseDependencies.some(path => releasePaths.has(path))) {
      packageNames.push(pkg.name)
    }
  }
  return packageNames.sort()
}

function invertGraph(graph: DependencyGraph): DependencyGraph {
  const dependentGraph: DependencyGraph = new Map()
  for (const [name, node] of graph) {
    dependentGraph.set(name, {
      deps: [],
      value: node.value,
    })
  }
  for (const [name, node] of graph) {
    for (const depName of node.deps) {
      dependentGraph.get(depName)?.deps.push(name)
    }
  }
  return dependentGraph
}

function visitDependents(
  graph: DependencyGraph,
  name: string,
  visited: Set<WorkspacePackage>,
  path: string[]
) {
  if (path.includes(name)) {
    throw new Error(
      `found cycle in dependency graph: ${path.join(' -> ')} -> ${name}`
    )
  }

  const node = graph.get(name)
  if (!node) {
    return
  }

  const nextPath = path.concat(name)
  for (const depName of node.deps) {
    visitDependents(graph, depName, visited, nextPath)
  }
  visited.add(node.value)
}

export function dependentPackageOrder(
  graph: DependencyGraph,
  packageNamesToUpdate: string[]
): WorkspacePackage[] {
  const dependentGraph = invertGraph(graph)
  const visited = new Set<WorkspacePackage>()
  for (const name of packageNamesToUpdate) {
    visitDependents(dependentGraph, name, visited, [])
  }
  return [...visited].sort((left, right) => left.name.localeCompare(right.name))
}
