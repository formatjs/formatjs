import {describe, expect, it} from 'vitest'

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

  it('keeps single-package platform selection unchanged', () => {
    expect(getNativePackageCandidates('darwin', 'arm64')).toEqual([
      '@formatjs/cli-native-darwin-arm64',
    ])
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
