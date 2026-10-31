import {describe, expect, it, vi} from 'vitest'
import {Runfiles} from '@bazel/runfiles'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {
  getInstalledNativePackageCandidates,
  getNativePackageCandidates,
} from '#packages/cli-lib/native.js'

describe('native package selection', () => {
  it('checks Linux x64 native packages that match os and cpu', () => {
    expect(getNativePackageCandidates('linux', 'x64')).toEqual([
      '@formatjs/cli-native-linux-x64',
      '@formatjs/cli-native-linux-x64-musl',
    ])
  })

  it('checks Linux arm64 native packages that match os and cpu', () => {
    expect(getNativePackageCandidates('linux', 'arm64')).toEqual([
      '@formatjs/cli-native-linux-arm64',
      '@formatjs/cli-native-linux-arm64-musl',
    ])
  })

  it.each([
    ['darwin', 'arm64', '@formatjs/cli-native-darwin-arm64'],
    ['darwin', 'x64', '@formatjs/cli-native-darwin-x64'],
    ['win32', 'arm64', '@formatjs/cli-native-win32-arm64'],
    ['win32', 'x64', '@formatjs/cli-native-win32-x64'],
  ] as const)('selects %s %s binding', (platform, arch, name) => {
    expect(getNativePackageCandidates(platform, arch)).toEqual([name])
  })

  it('uses the installed native package when package metadata narrowed it', () => {
    expect(
      getInstalledNativePackageCandidates(
        getNativePackageCandidates('linux', 'x64'),
        candidate => candidate.endsWith('-musl')
      )
    ).toEqual(['@formatjs/cli-native-linux-x64-musl'])
  })
})

describe('native runfiles loading', () => {
  it('loads the binding after changing working directory', async () => {
    vi.resetModules()
    const {loadNative} = await import('#packages/cli-lib/native.js')
    const directory = mkdtempSync(join(tmpdir(), 'formatjs-native-cwd-'))
    const previousDirectory = process.cwd()
    try {
      process.chdir(directory)
      expect(loadNative().supportedBuiltinFormatters()).toContain('simple')
    } finally {
      process.chdir(previousDirectory)
      rmSync(directory, {recursive: true, force: true})
    }
  })

  it('loads the binding from a manifest without a runfiles tree', async () => {
    const binding = new Runfiles().resolveWorkspaceRelative(
      'packages/cli-lib/formatjs_cli_napi.node'
    )
    const workspace =
      process.env.BAZEL_WORKSPACE || process.env.JS_BINARY__WORKSPACE
    const directory = mkdtempSync(join(tmpdir(), 'formatjs-native-manifest-'))
    const manifest = join(directory, 'MANIFEST')
    writeFileSync(
      manifest,
      `${workspace}/packages/cli-lib/formatjs_cli_napi.node ${binding}\n`
    )
    vi.stubEnv('RUNFILES_MANIFEST_FILE', manifest)
    vi.stubEnv('RUNFILES_DIR', undefined)
    vi.stubEnv('RUNFILES', undefined)
    try {
      vi.resetModules()
      const {loadNative} = await import('#packages/cli-lib/native.js')
      expect(loadNative().supportedBuiltinFormatters()).toContain('simple')
    } finally {
      vi.unstubAllEnvs()
      rmSync(directory, {recursive: true, force: true})
    }
  })
})
