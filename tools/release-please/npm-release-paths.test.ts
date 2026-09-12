import assert from 'node:assert/strict'

import {
  collectNpmReleasePaths,
  isNpmVersionPublished,
  orderNpmReleasePaths,
  publishNpmPackages,
  type NpmPackage,
} from './npm-release-paths.ts'

const packages: Record<string, NpmPackage> = {
  'packages/duration': {
    name: '@formatjs/duration',
    version: '0.11.0',
    dependencies: {'@formatjs/matcher': '0.8.14'},
  },
  'packages/matcher': {name: '@formatjs/matcher', version: '0.8.14'},
  'packages/private': {name: 'private', version: '1.0.0', private: true},
}
const manifest = {
  'packages/duration': '0.11.0',
  'packages/matcher': '0.8.14',
  'packages/private': '1.0.0',
  'crates/parser': '1.0.0',
}
const published = new Set<string>(['@formatjs/duration@0.11.0'])
const isPublished = async (name: string, version: string) =>
  published.has(`${name}@${version}`)

// Recover a dependency left behind by an older release, even with no manifest diff.
assert.deepEqual(
  await collectNpmReleasePaths(manifest, packages, isPublished),
  ['packages/matcher']
)
published.add('@formatjs/matcher@0.8.14')
assert.deepEqual(
  await collectNpmReleasePaths(manifest, packages, isPublished),
  []
)
published.clear()
assert.deepEqual(
  await collectNpmReleasePaths(manifest, packages, isPublished),
  ['packages/matcher', 'packages/duration']
)
await assert.rejects(
  collectNpmReleasePaths({'packages/matcher': '0.8.15'}, packages, isPublished),
  /Release version mismatch/
)
await assert.rejects(
  collectNpmReleasePaths({'packages/missing': '1.0.0'}, packages, isPublished),
  /Missing release package manifest/
)

const response =
  (status: number, body: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(body), {status})
assert.equal(
  await isNpmVersionPublished('pkg', '1.0.0', response(404, {})),
  false
)
assert.equal(
  await isNpmVersionPublished('pkg', '1.0.0', async url => {
    assert.equal(String(url), 'https://registry.npmjs.org/pkg?write=true')
    return new Response(
      JSON.stringify({
        name: 'pkg',
        versions: {'1.0.0': {name: 'pkg', version: '1.0.0'}},
      })
    )
  }),
  true
)
for (const status of [401, 403, 429, 500]) {
  await assert.rejects(
    isNpmVersionPublished('pkg', '1.0.0', response(status, {})),
    new RegExp(`registry returned ${status}`)
  )
}
await assert.rejects(
  isNpmVersionPublished(
    'pkg',
    '1.0.0',
    response(200, {
      name: 'pkg',
      versions: {'1.0.0': {name: 'pkg', version: '0.9.0'}},
    })
  ),
  /Unexpected npm registry response/
)
await assert.rejects(
  isNpmVersionPublished('pkg', '1.0.0', async () => {
    throw new Error('DNS failure')
  }),
  /DNS failure/
)

const uploads: string[] = []
const publish = async (path: string) => {
  uploads.push(path)
  const pkg = packages[path]
  published.add(`${pkg.name}@${pkg.version}`)
}
await publishNpmPackages(
  ['packages/duration', 'packages/matcher'],
  packages,
  publish,
  isPublished
)
assert.deepEqual(uploads, ['packages/matcher', 'packages/duration'])
await publishNpmPackages(
  ['packages/duration', 'packages/matcher'],
  packages,
  publish,
  isPublished
)
assert.equal(uploads.length, 2)

// A missing dependency outside the selected batch must block publication too.
published.clear()
uploads.length = 0
await assert.rejects(
  publishNpmPackages(['packages/duration'], packages, publish, isPublished),
  /missing @formatjs\/matcher@0.8.14/
)
assert.deepEqual(uploads, [])

// Failed or invisible dependency publication must never release the dependent.
for (const fail of [true, false]) {
  const attempted: string[] = []
  await assert.rejects(
    publishNpmPackages(
      ['packages/duration', 'packages/matcher'],
      packages,
      async path => {
        attempted.push(path)
        if (fail) throw new Error('publish failed')
      },
      isPublished,
      async () => {}
    ),
    fail ? /publish failed/ : /publication not visible/
  )
  assert.deepEqual(attempted, ['packages/matcher'])
}

await publishNpmPackages(
  ['packages/matcher'],
  packages,
  async path => {
    await publish(path)
    throw new Error('concurrent publication')
  },
  isPublished
)

for (const field of ['optionalDependencies', 'peerDependencies']) {
  const withDependency = {
    ...packages,
    'packages/duration': {
      name: '@formatjs/duration',
      version: '0.11.0',
      [field]: {'@formatjs/matcher': '0.8.14'},
    },
  }
  assert.deepEqual(
    orderNpmReleasePaths(
      ['packages/duration', 'packages/matcher'],
      withDependency
    ),
    ['packages/matcher', 'packages/duration']
  )
  published.clear()
  await assert.rejects(
    publishNpmPackages(
      ['packages/duration'],
      withDependency,
      publish,
      isPublished
    ),
    /missing @formatjs\/matcher/
  )
}
assert.throws(
  () => orderNpmReleasePaths(['packages/private'], packages),
  /Invalid npm release package/
)
assert.throws(
  () =>
    orderNpmReleasePaths(['packages/duration', 'packages/matcher'], {
      ...packages,
      'packages/matcher': {
        ...packages['packages/matcher'],
        dependencies: {'@formatjs/duration': '0.11.0'},
      },
    }),
  /Circular npm release dependency/
)
console.log(
  'Verified npm release reconciliation and dependency-safe publication'
)

// Registry propagation can lag behind a successful upload.
published.clear()
let polls = 0
let waits = 0
await publishNpmPackages(
  ['packages/matcher'],
  packages,
  async () => {},
  async () => ++polls >= 4,
  async milliseconds => {
    assert.equal(milliseconds, 5_000)
    waits++
  }
)
assert.equal(waits, 2)

console.log(
  'Verified npm release reconciliation and dependency-safe publication'
)

assert.equal(
  await isNpmVersionPublished(
    'pkg',
    '1.0.0',
    response(200, {name: 'pkg', versions: {}})
  ),
  false
)

// Independent uploads can proceed while registry visibility catches up.
const independent = {
  'packages/first': {name: 'first', version: '1.0.0'},
  'packages/second': {name: 'second', version: '1.0.0'},
}
const independentUploads: string[] = []
await publishNpmPackages(
  Object.keys(independent),
  independent,
  async path => {
    independentUploads.push(path)
  },
  async () => independentUploads.length === 2,
  async () => {
    assert.fail('Independent uploads must not wait on each other')
  }
)
assert.deepEqual(independentUploads, Object.keys(independent))
console.log(
  'Verified npm release reconciliation and dependency-safe publication'
)
