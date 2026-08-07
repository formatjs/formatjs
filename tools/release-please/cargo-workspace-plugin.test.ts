import assert from 'node:assert/strict'

import {createCargoWorkspacePlugin} from './cargo-workspace-plugin.ts'

const packages = {
  allPackages: [
    {
      name: 'published',
      manifest: {package: {name: 'published'}},
    },
    {
      name: 'private',
      manifest: {package: {name: 'private', publish: false}},
    },
    {
      name: 'private-registry',
      manifest: {package: {name: 'private-registry', publish: ['internal']}},
    },
  ],
  candidatesByPackage: {
    published: {path: 'crates/published'},
    private: {path: 'crates/private'},
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
  ['published', 'private-registry']
)
assert.deepEqual(Object.keys(result.candidatesByPackage), [
  'published',
  'private-registry',
])
