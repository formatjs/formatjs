import assert from 'node:assert/strict'

import {
  buildDependencyGraph,
  dependencyNames,
  dependentPackageOrder,
} from './npm-workspace-graph.ts'

const packages = [
  {
    path: 'packages/core',
    name: '@formatjs/core',
    version: '1.0.0',
  },
  {
    path: 'packages/runtime',
    name: '@formatjs/runtime',
    version: '1.0.0',
    dependencies: {
      '@formatjs/core': 'workspace:*',
      external: '^1.0.0',
    },
  },
  {
    path: 'packages/optional-runtime',
    name: '@formatjs/optional-runtime',
    version: '1.0.0',
    optionalDependencies: {
      '@formatjs/core': 'workspace:*',
    },
  },
  {
    path: 'packages/peer-runtime',
    name: '@formatjs/peer-runtime',
    version: '1.0.0',
    peerDependencies: {
      '@formatjs/core': 'workspace:*',
    },
  },
]

const graph = buildDependencyGraph(packages)
assert.deepEqual(graph.get('@formatjs/runtime').deps, ['@formatjs/core'])
assert.deepEqual(graph.get('@formatjs/optional-runtime').deps, [
  '@formatjs/core',
])
assert.deepEqual(graph.get('@formatjs/peer-runtime').deps, [])

assert.deepEqual(
  dependentPackageOrder(graph, ['@formatjs/core']).map(pkg => pkg.name),
  ['@formatjs/core', '@formatjs/optional-runtime', '@formatjs/runtime']
)

assert.deepEqual(
  dependencyNames(packages[3], {includePeerDependencies: true}),
  ['@formatjs/core']
)

const graphWithPeers = buildDependencyGraph(packages, {
  includePeerDependencies: true,
})
assert.deepEqual(
  dependentPackageOrder(graphWithPeers, ['@formatjs/core']).map(
    pkg => pkg.name
  ),
  [
    '@formatjs/core',
    '@formatjs/optional-runtime',
    '@formatjs/peer-runtime',
    '@formatjs/runtime',
  ]
)

assert.throws(
  () =>
    buildDependencyGraph([
      {
        path: 'packages/one',
        name: '@formatjs/one',
        version: '1.0.0',
      },
      {
        path: 'packages/two',
        name: '@formatjs/one',
        version: '1.0.0',
      },
    ]),
  /duplicate workspace package name: @formatjs\/one/
)

assert.throws(() => {
  const cycleGraph = buildDependencyGraph([
    {
      path: 'packages/a',
      name: 'a',
      version: '1.0.0',
      dependencies: {b: 'workspace:*'},
    },
    {
      path: 'packages/b',
      name: 'b',
      version: '1.0.0',
      dependencies: {a: 'workspace:*'},
    },
  ])
  dependentPackageOrder(cycleGraph, ['a'])
}, /found cycle in dependency graph: a -> b -> a/)
