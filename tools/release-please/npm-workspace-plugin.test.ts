import {registerPrereleaseVersioning} from './prerelease-versioning.ts'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'

import {BazelNpmWorkspace} from './npm-workspace-plugin.ts'
import {readGraph} from './npm-workspace-graph.ts'

const require = createRequire(import.meta.url)
const {VERSION} = require('release-please')
const {
  buildVersioningStrategy,
} = require('release-please/build/src/factories/versioning-strategy-factory')
registerPrereleaseVersioning()
const {Bazel} = require('release-please/build/src/strategies/bazel')
const {Version} = require('release-please/build/src/version')
const {
  buildChangelogNotes,
} = require('release-please/build/src/factories/changelog-notes-factory')
const {
  PatchVersionUpdate,
} = require('release-please/build/src/versioning-strategy')

assert.equal(VERSION, '17.6.0')
const graphPath = process.argv[2]
const packages = readGraph(graphPath).packages
const rawConfig = JSON.parse(readFileSync(process.argv[3], 'utf8'))
const repositoryConfig = Object.fromEntries(
  Object.entries(rawConfig.packages).map(([path, config]) => [
    path,
    {
      releaseType: config['release-type'] || rawConfig['release-type'],
      prerelease: config.prerelease,
    },
  ])
)
const logger = {debug() {}, info() {}, warn() {}, error() {}}
const github = {
  repository: {owner: 'formatjs', repo: 'formatjs', defaultBranch: 'main'},
}

// GitHub-generated notes ignore the package-filtered commit list.
const notes = await buildChangelogNotes({
  type: rawConfig['changelog-type'],
  github: {
    ...github,
    generateReleaseNotes: async () =>
      '* feat(@formatjs/editor): unrelated editor change',
  },
}).buildNotes(
  [
    {
      sha: '1234567890abcdef1234567890abcdef12345678',
      message:
        'fix(@formatjs/intl-datetimeformat): preserve locale hour preferences',
      bareMessage: 'preserve locale hour preferences',
      type: 'fix',
      scope: '@formatjs/intl-datetimeformat',
      notes: [],
      references: [],
    },
  ],
  {
    owner: 'formatjs',
    repository: 'formatjs',
    version: '1.0.1',
    previousTag: '@formatjs/intl-datetimeformat@1.0.0',
    currentTag: '@formatjs/intl-datetimeformat@1.0.1',
    targetBranch: 'main',
  }
)
assert.match(notes, /preserve locale hour preferences/)
assert(!notes.includes('@formatjs/editor'))
for (const [path, packageConfig] of Object.entries(rawConfig.packages)) {
  assert.equal(
    packageConfig['changelog-type'] ?? rawConfig['changelog-type'],
    'default',
    `${path} must use package-scoped changelog notes`
  )
}

async function run(paths: string[]) {
  const plugin = new BazelNpmWorkspace(github, 'main', repositoryConfig, {
    graphPath,
    merge: false,
    logger,
  })
  const strategies = Object.fromEntries(
    packages.map(pkg => [
      pkg.path,
      new Bazel({
        github,
        targetBranch: 'main',
        versioningStrategy: buildVersioningStrategy({
          type: rawConfig.packages[pkg.path].versioning,
          prerelease: rawConfig.packages[pkg.path].prerelease,
          prereleaseType: rawConfig.packages[pkg.path]['prerelease-type'],
        }),
        path: pkg.path,
        component: pkg.name,
        packageName: pkg.name,
        versionFile: 'BUILD.bazel',
        extraFiles: rawConfig.packages[pkg.path]['extra-files'],
        changelogNotes: {buildNotes: async () => '## Fixture\n\nRelease'},
        logger,
      }),
    ])
  )
  await plugin.preconfigure(strategies, {}, {})
  const candidates = await Promise.all(
    paths.map(async path => {
      const pkg = packages.find(pkg => pkg.path === path)
      const version = pkg
        ? strategies[path].versioningStrategy.bump(
            Version.parse(pkg.version),
            []
          )
        : Version.parse('99.0.0')
      return {
        path,
        config: repositoryConfig[path],
        pullRequest: pkg
          ? await strategies[path].buildReleasePullRequest(
              [],
              undefined,
              false,
              [],
              {newVersion: version}
            )
          : {version},
      }
    })
  )
  return plugin.run(candidates)
}

const paths = candidates => candidates.map(candidate => candidate.path).sort()
assert.deepEqual(paths(await run(['packages/editor'])), ['packages/editor'])
assert.deepEqual(paths(await run(['packages/react-intl'])), [
  'packages/react-intl',
])
const runtime = await run(['packages/intl'])
assert(runtime.some(candidate => candidate.path === 'packages/react-intl'))
assert(!runtime.some(candidate => candidate.path === 'packages/editor'))
const react = runtime.find(
  candidate => candidate.path === 'packages/react-intl'
)
assert.match(
  react.pullRequest.body.releaseData[0].notes,
  /@formatjs\/intl bumped/
)

const expectedNative = [
  'packages/cli',
  'packages/cli-lib',
  'packages/cli-native-darwin-arm64',
  'packages/cli-native-linux-arm64',
  'packages/cli-native-linux-arm64-musl',
  'packages/cli-native-linux-x64',
  'packages/cli-native-linux-x64-musl',
  'packages/cli-native-win32-x64',
].sort()
const rustOnly = await run(['crates/formatjs_cli'])
assert.deepEqual(paths(rustOnly), ['crates/formatjs_cli', ...expectedNative])
for (const candidate of rustOnly.filter(candidate =>
  candidate.path.startsWith('packages/')
)) {
  const pkg = packages.find(pkg => pkg.path === candidate.path)
  assert.equal(
    candidate.pullRequest.version.toString(),
    new PatchVersionUpdate().bump(Version.parse(pkg.version)).toString()
  )
}
let manifest = '{}'
for (const candidate of rustOnly) {
  for (const update of candidate.pullRequest.updates || []) {
    if (update.path === '.release-please-manifest.json') {
      manifest = update.updater.updateContent(manifest)
    }
  }
}
const manifestVersions = JSON.parse(manifest)
assert.deepEqual(Object.keys(manifestVersions).sort(), expectedNative)
for (const candidate of rustOnly.filter(candidate =>
  candidate.path.startsWith('packages/')
)) {
  assert.equal(
    manifestVersions[candidate.path],
    candidate.pullRequest.version.toString()
  )
}
const cli = rustOnly.find(candidate => candidate.path === 'packages/cli')
assert.match(cli.pullRequest.body.releaseData[0].notes, /optionalDependencies/)
for (const path of expectedNative.filter(path =>
  path.includes('/cli-native-')
)) {
  const pkg = packages.find(pkg => pkg.path === path)
  assert(
    cli.pullRequest.body.releaseData[0].notes.includes(
      `${pkg.name} bumped to ${manifestVersions[path]}`
    )
  )
}
assert.deepEqual(
  paths(await run(['crates/formatjs_cli', 'packages/editor'])),
  ['crates/formatjs_cli', ...expectedNative, 'packages/editor'].sort()
)
assert.deepEqual(paths(await run(['crates/formatjs_intl'])), [
  'crates/formatjs_intl',
])
assert.deepEqual(await run([]), [])
console.log(
  'Verified native-only, npm dependency, optional dependency, and unrelated releases'
)

const messagingPaths = [
  'packages/eslint-plugin-formatjs',
  'packages/intl',
  'packages/intl-messageformat',
  'packages/react-intl',
  'packages/svelte-intl',
  'packages/vue-intl',
].sort()
assert.deepEqual(
  Object.entries(rawConfig.packages)
    .filter(([, config]) => config.prerelease)
    .map(([path]) => path)
    .sort(),
  []
)
for (const path of messagingPaths) {
  assert.equal(rawConfig.packages[path].prerelease, false)
  assert.equal(rawConfig.packages[path].versioning, 'prerelease')
  assert.equal(rawConfig.packages[path]['prerelease-type'], 'rc.0')
}
const stableCandidates = await run([
  'packages/intl-messageformat',
  'packages/eslint-plugin-formatjs',
])
assert.deepEqual(paths(stableCandidates), messagingPaths)
for (const candidate of stableCandidates) {
  assert.equal(candidate.config.prerelease, false)
  assert.match(candidate.pullRequest.version.toString(), /^\d+\.\d+\.\d+$/)
}
const rcStrategy = buildVersioningStrategy({
  type: 'prerelease',
  prerelease: true,
  prereleaseType: 'rc.0',
})
const fix = [{type: 'fix', breaking: false, notes: []}]
const feat = [{type: 'feat', breaking: false, notes: []}]
const breaking = [{type: 'feat', breaking: true, notes: []}]
assert.equal(
  rcStrategy.bump(Version.parse('10.2.2'), breaking).toString(),
  '11.0.0-rc.0'
)
assert.equal(
  rcStrategy.bump(Version.parse('11.0.0-rc.0'), fix).toString(),
  '11.0.0-rc.1'
)
assert.equal(
  rcStrategy.bump(Version.parse('11.0.0-rc.1'), breaking).toString(),
  '11.0.0-rc.2'
)
// Changing the bump level must never accidentally create a stable release.
assert.equal(
  rcStrategy.bump(Version.parse('10.2.3-rc.0'), breaking).toString(),
  '11.0.0-rc.0'
)
assert.equal(
  rcStrategy.bump(Version.parse('10.2.3-rc.0'), feat).toString(),
  '10.3.0-rc.0'
)
// Framework wrappers expose the breaking core signatures and readonly helpers.
assert.equal(
  rcStrategy.bump(Version.parse('1.1.20-rc.1'), breaking).toString(),
  '2.0.0-rc.1'
)
assert.equal(
  rcStrategy.bump(Version.parse('7.2.20-rc.1'), breaking).toString(),
  '8.0.0-rc.1'
)
const stableStrategy = buildVersioningStrategy({
  type: 'prerelease',
  prerelease: false,
  prereleaseType: 'rc.0',
})
assert.equal(
  stableStrategy.bump(Version.parse('11.0.0-rc.2'), fix).toString(),
  '11.0.0'
)
console.log('Verified RC versions, dependent releases, and stable promotion')

// Wrappers must include their breaking changes when graduating from patch RCs.
assert.equal(
  stableStrategy.bump(Version.parse('1.1.20-rc.1'), breaking).toString(),
  '2.0.0'
)
assert.equal(
  stableStrategy.bump(Version.parse('7.2.20-rc.1'), breaking).toString(),
  '8.0.0'
)

// Generated calendar payloads must release when their shared generator releases,
// even though peer dependencies do not normally propagate version bumps.
const calendarReleases = await run(['packages/intl-datetimeformat'])
const calendarPackages = packages.filter(pkg =>
  pkg.path.startsWith('packages/intl-datetimeformat-calendar-')
)
const registeredCalendars = Object.keys(
  JSON.parse(readFileSync(process.argv[4], 'utf8')).calendars
)
assert.deepEqual(
  calendarPackages.map(pkg => pkg.path).sort(),
  registeredCalendars
    .map(calendar => `packages/intl-datetimeformat-calendar-${calendar}`)
    .sort()
)
for (const pkg of calendarPackages) {
  const candidate = calendarReleases.find(
    candidate => candidate.path === pkg.path
  )
  assert.ok(candidate, `${pkg.name} must release with DateTimeFormat`)
  assert.equal(
    candidate.pullRequest.version.toString(),
    new PatchVersionUpdate().bump(Version.parse(pkg.version)).toString()
  )
  const buildUpdate = candidate.pullRequest.updates.find(
    update => update.path === `${pkg.path}/BUILD.bazel`
  )
  assert.ok(buildUpdate)
  assert.ok(
    buildUpdate.updater
      .updateContent(
        `calendar_package(\n    version = "${pkg.version}",  # x-release-please-version\n)\n`
      )
      .includes(`version = "${candidate.pullRequest.version}"`)
  )
  const manifestUpdate = candidate.pullRequest.updates.find(
    update => update.path === `${pkg.path}/package.json`
  )
  assert.ok(manifestUpdate)
  assert.equal(
    JSON.parse(
      manifestUpdate.updater.updateContent(
        JSON.stringify({name: pkg.name, version: pkg.version})
      )
    ).version,
    candidate.pullRequest.version.toString()
  )
}
