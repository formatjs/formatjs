import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
const registry = read(process.argv[2])
const graph = read(process.argv[3])
const config = read(process.argv[4])
const manifest = read(process.argv[5])
const workspace = read(process.argv[6])
const prefix = 'intl-datetimeformat-calendar-'
const calendars = Object.keys(registry.calendars).sort()
assert.ok(calendars.length > 0)
assert.deepEqual(
  registry.packages,
  calendars.map(calendar => prefix + calendar),
  'distribution package coverage'
)
assert.deepEqual(
  registry.implementations,
  calendars,
  'calendar implementation coverage'
)
assert.deepEqual(
  registry.entrypoints,
  calendars,
  'calendar entrypoint coverage'
)
for (const [calendar, mapping] of Object.entries(registry.calendars)) {
  assert.match(calendar, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  assert.ok(
    Array.isArray(mapping) && mapping.length === 2,
    `${calendar}: CLDR package/file pair required`
  )
  for (const value of mapping) assert.match(value, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
}

const expectedPaths = calendars.map(calendar => `packages/${prefix}${calendar}`)
const calendarPackages = graph.packages.filter(pkg =>
  pkg.path.startsWith(`packages/${prefix}`)
)
assert.deepEqual(
  calendarPackages.map(pkg => pkg.path).sort(),
  expectedPaths,
  'publishable calendar package coverage'
)
for (const [label, paths] of [
  ['Release Please config', Object.keys(config.packages)],
  ['Release Please manifest', Object.keys(manifest)],
] as const) {
  assert.deepEqual(
    paths.filter(path => path.startsWith(`packages/${prefix}`)).sort(),
    expectedPaths,
    label
  )
}
assert.deepEqual(
  Object.keys(workspace.devDependencies)
    .filter(name => name.startsWith(`@formatjs/${prefix}`))
    .sort(),
  calendars.map(calendar => `@formatjs/${prefix}${calendar}`),
  'workspace calendar package coverage'
)
for (const pkg of calendarPackages) {
  const calendar = pkg.path.slice(`packages/${prefix}`.length)
  assert.equal(pkg.name, `@formatjs/${prefix}${calendar}`)
  assert.equal(pkg.version, manifest[pkg.path], `${pkg.name}: release version`)
  assert.ok(
    pkg.releaseDependencies.includes('packages/intl-datetimeformat'),
    `${pkg.name}: shared generator release dependency`
  )
  assert.equal(
    pkg.peerDependencies['@formatjs/intl-datetimeformat'],
    'workspace:*'
  )
  assert.equal(workspace.devDependencies[pkg.name], 'workspace:*')
  const release = config.packages[pkg.path]
  assert.equal(release['package-name'], pkg.name)
  assert.equal(release['release-type'] ?? config['release-type'], 'bazel')
  assert.equal(release['version-file'], 'BUILD.bazel')
  assert.ok(release['extra-files'].includes('package.json'))
  assert.ok(
    release['extra-files'].some(
      file => file.type === 'generic' && file.path === 'BUILD.bazel'
    ),
    `${pkg.name}: BUILD version updater`
  )
}
