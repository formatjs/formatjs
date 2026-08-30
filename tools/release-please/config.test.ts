import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)

// Load the public entrypoint first so release-please initializes its built-in
// strategy graph before the deep imports below.
const {VERSION} = require('release-please')
const {Bazel} = require('release-please/build/src/strategies/bazel')
const {Python} = require('release-please/build/src/strategies/python')
const {Version} = require('release-please/build/src/version')
const {parse} = require('yaml')

const SENTINEL_VERSION = '99.88.77'
const config = JSON.parse(readFileSync('release-please-config.json', 'utf8'))
const releaseNotesConfig = parse(readFileSync('.github/release.yml', 'utf8'))
const logger = {
  debug() {},
  error() {},
  info() {},
  warn() {},
}
let checked = 0

assert.equal(VERSION, '17.6.0')
assert.equal(config['changelog-type'], 'github')
assert.deepEqual(releaseNotesConfig.changelog.exclude.authors, [
  'renovate[bot]',
])

for (const [path, packageConfig] of Object.entries(config.packages)) {
  if (!path.startsWith('packages/')) {
    continue
  }

  const releaseType =
    packageConfig['release-type'] ?? config['release-type'] ?? 'node'
  assert.equal(releaseType, 'bazel', `${path} must use the Bazel strategy`)

  const strategy = new Bazel({
    changelogNotes: {buildNotes: async () => '* fixture'},
    component: packageConfig.component,
    extraFiles: packageConfig['extra-files'] ?? config['extra-files'],
    github: {
      repository: {
        defaultBranch: 'main',
        owner: 'formatjs',
        repo: 'formatjs',
      },
    },
    logger,
    packageName: packageConfig['package-name'],
    path,
    skipChangelog: true,
    targetBranch: 'main',
    versionFile: packageConfig['version-file'] ?? config['version-file'],
  })
  const candidate = await strategy.buildReleasePullRequest(
    [],
    undefined,
    false,
    [],
    {newVersion: Version.parse(SENTINEL_VERSION)}
  )
  assert(candidate, `${path} did not produce a release candidate`)

  const packageJsonPath = `${path}/package.json`
  const packageJsonUpdate = candidate.updates.find(
    update => update.path === packageJsonPath
  )
  assert(
    packageJsonUpdate,
    `${path} did not generate a package.json version update`
  )
  assert.equal(packageJsonUpdate.createIfMissing, false)

  const updated = packageJsonUpdate.updater.updateContent(
    readFileSync(packageJsonPath, 'utf8')
  )
  assert.equal(JSON.parse(updated).version, SENTINEL_VERSION)
  checked++
}

assert(checked > 0, 'no npm release packages were checked')
console.log(`Verified ${checked} Release Please package.json updates`)

const pythonPackages = [
  'python/icu_skeleton_parser',
  'python/icu_messageformat_parser',
  'python/icu_messageformat',
  'python/intl',
]
let checkedPython = 0

for (const path of pythonPackages) {
  const packageConfig = config.packages[path]
  assert(packageConfig, `${path} is missing from Release Please config`)
  assert.equal(packageConfig['release-type'], 'python')
  assert.equal(packageConfig['changelog-type'], 'default')

  const strategy = new Python({
    changelogNotes: {buildNotes: async () => '* fixture'},
    component: packageConfig.component,
    extraFiles: packageConfig['extra-files'],
    github: {
      repository: {
        defaultBranch: 'main',
        owner: 'formatjs',
        repo: 'formatjs',
      },
      findFilesByFilenameAndRef: async () => [],
      getFileContentsOnBranch: async () => {
        throw new Error('not found')
      },
    },
    logger,
    packageName: packageConfig['package-name'],
    path,
    skipChangelog: true,
    targetBranch: 'main',
  })
  const candidate = await strategy.buildReleasePullRequest(
    [],
    undefined,
    false,
    [],
    {newVersion: Version.parse(SENTINEL_VERSION)}
  )
  assert(candidate, `${path} did not produce a release candidate`)

  const file = `${path}/BUILD.bazel`
  const update = candidate.updates.find(candidate => candidate.path === file)
  assert(update, `${path} did not update ${file}`)
  const updated = update.updater.updateContent(readFileSync(file, 'utf8'))
  assert(updated.includes(SENTINEL_VERSION), `${file} version did not update`)
  checkedPython++
}

assert.equal(checkedPython, 4)
console.log(`Verified ${checkedPython} Release Please Python package updates`)
