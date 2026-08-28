import assert from 'node:assert/strict'

import {
  createCargoWorkspacePlugin,
  resolveWorkspacePluginOptions,
} from './cargo-workspace-plugin.ts'

const packages = {
  allPackages: [
    {
      name: 'published',
      manifest: {package: {name: 'published'}},
    },
    {
      name: 'private-release-component',
      manifest: {package: {name: 'private-release-component', publish: false}},
    },
    {
      name: 'private-workspace-dependency',
      manifest: {
        package: {name: 'private-workspace-dependency', publish: false},
      },
    },
    {
      name: 'private-empty-registries',
      manifest: {package: {name: 'private-empty-registries', publish: []}},
    },
    {
      name: 'private-registry',
      manifest: {package: {name: 'private-registry', publish: ['internal']}},
    },
  ],
  candidatesByPackage: {
    published: {path: 'crates/published'},
    'private-release-component': {
      path: 'crates/private-release-component',
    },
    'private-registry': {path: 'crates/private-registry'},
  },
}

class FixtureCargoWorkspace {
  async buildAllPackages() {
    return packages
  }
}

const FormatjsCargoWorkspace = createCargoWorkspacePlugin(FixtureCargoWorkspace)
const result = await new FormatjsCargoWorkspace().buildAllPackages([])

assert.deepEqual(
  result.allPackages.map(pkg => pkg.name),
  ['published', 'private-release-component', 'private-registry']
)
assert.deepEqual(Object.keys(result.candidatesByPackage), [
  'published',
  'private-release-component',
  'private-registry',
])

assert.equal(
  resolveWorkspacePluginOptions({merge: false, separatePullRequests: false})
    .merge,
  false
)
assert.equal(
  resolveWorkspacePluginOptions({
    merge: false,
    separatePullRequests: false,
    type: {merge: true},
  }).merge,
  true
)
assert.equal(
  resolveWorkspacePluginOptions({separatePullRequests: true}).merge,
  false
)
