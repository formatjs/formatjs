import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'

import {BazelNpmWorkspace} from './npm-workspace-plugin.ts'
import {readGraph} from './npm-workspace-graph.ts'

const require = createRequire(import.meta.url)
const {VERSION} = require('release-please')
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
    {releaseType: config['release-type'] || rawConfig['release-type']},
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
        path: pkg.path,
        component: pkg.name,
        packageName: pkg.name,
        versionFile: 'BUILD.bazel',
        extraFiles: ['package.json'],
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
        ? new PatchVersionUpdate().bump(Version.parse(pkg.version))
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
