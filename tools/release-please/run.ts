import {appendFileSync} from 'node:fs'
import {createRequire} from 'node:module'

import {BazelNpmWorkspace} from './npm-workspace-plugin.ts'

const require = createRequire(import.meta.url)
const {GitHub, Manifest, VERSION, registerPlugin} = require('release-please')

const DEFAULT_CONFIG_FILE = 'release-please-config.json'
const DEFAULT_MANIFEST_FILE = '.release-please-manifest.json'
const DEFAULT_GITHUB_API_URL = 'https://api.github.com'
const DEFAULT_GITHUB_GRAPHQL_URL = 'https://api.github.com'

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function boolEnv(name: string): boolean | undefined {
  const value = process.env[name]
  if (value === undefined || value === '') {
    return undefined
  }
  return value === 'true'
}

function setOutput(key: string, value) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${serialized}\n`)
  } else {
    console.log(`${key}=${serialized}`)
  }
}

function setPathOutput(path: string, key: string, value) {
  setOutput(path === '.' ? key : `${path}--${key}`, value)
}

function outputReleases(releases) {
  const created = releases.filter(release => release)
  const pathsReleased = []
  setOutput('releases_created', created.length > 0)

  for (const release of created) {
    const path = release.path || '.'
    pathsReleased.push(path)
    setPathOutput(path, 'release_created', true)

    for (const [rawKey, value] of Object.entries(release)) {
      let key = rawKey
      if (key === 'tagName') {
        key = 'tag_name'
      } else if (key === 'uploadUrl') {
        key = 'upload_url'
      } else if (key === 'notes') {
        key = 'body'
      } else if (key === 'url') {
        key = 'html_url'
      }
      setPathOutput(path, key, value)
    }
  }

  setOutput('paths_released', JSON.stringify(pathsReleased))
}

function outputPullRequests(pullRequests) {
  const created = pullRequests.filter(pullRequest => pullRequest)
  setOutput('prs_created', created.length > 0)
  if (created.length > 0) {
    setOutput('pr', created[0])
    setOutput('prs', JSON.stringify(created))
  }
}

function registerFormatjsPlugin() {
  registerPlugin('formatjs-bazel-workspace', options => {
    const typeOptions =
      options.type && typeof options.type === 'object' ? options.type : {}
    return new BazelNpmWorkspace(
      options.github,
      options.targetBranch,
      options.repositoryConfig,
      {
        ...options,
        ...typeOptions,
        merge: typeOptions.merge ?? !options.separatePullRequests,
      }
    )
  })
}

async function loadManifest(github, targetBranch: string) {
  return Manifest.fromManifest(
    github,
    targetBranch,
    process.env.RELEASE_PLEASE_CONFIG_FILE || DEFAULT_CONFIG_FILE,
    process.env.RELEASE_PLEASE_MANIFEST_FILE || DEFAULT_MANIFEST_FILE,
    {
      fork: boolEnv('RELEASE_PLEASE_FORK'),
      skipLabeling: boolEnv('RELEASE_PLEASE_SKIP_LABELING'),
    }
  )
}

async function main() {
  console.log(`Running release-please version: ${VERSION}`)
  registerFormatjsPlugin()

  const [owner, repo] = requiredEnv('GITHUB_REPOSITORY').split('/')
  const token = process.env.GH_RELEASE_TOKEN || process.env.GITHUB_TOKEN || ''
  if (!token) {
    throw new Error('GH_RELEASE_TOKEN or GITHUB_TOKEN is required')
  }

  const requestedTargetBranch = process.env.RELEASE_PLEASE_TARGET_BRANCH
  const github = await GitHub.create({
    owner,
    repo,
    token,
    apiUrl: process.env.GITHUB_API_URL || DEFAULT_GITHUB_API_URL,
    graphqlUrl: (
      process.env.GITHUB_GRAPHQL_URL || DEFAULT_GITHUB_GRAPHQL_URL
    ).replace(/\/graphql$/, ''),
    defaultBranch: requestedTargetBranch,
  })
  const targetBranch = requestedTargetBranch || github.repository.defaultBranch

  const releaseManifest = await loadManifest(github, targetBranch)
  outputReleases(await releaseManifest.createReleases())

  const pullRequestManifest = await loadManifest(github, targetBranch)
  outputPullRequests(await pullRequestManifest.createPullRequests())
}

if (import.meta.filename === process.argv[1]) {
  main().catch(error => {
    console.error(`release-please failed: ${error.message}`)
    if (process.env.RELEASE_PLEASE_DEBUG === 'true') {
      console.error(error.stack)
    }
    process.exitCode = 1
  })
}
