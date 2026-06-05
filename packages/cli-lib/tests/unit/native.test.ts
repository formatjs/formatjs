import {describe, expect, it} from 'vitest'

import {getNativePackageCandidates} from '#packages/cli-lib/native.js'

describe('native package selection', () => {
  it('prefers the musl package on Linux musl x64', () => {
    expect(getNativePackageCandidates('linux', 'x64', true)).toEqual([
      '@formatjs/cli-native-linux-x64-musl',
      '@formatjs/cli-native-linux-x64',
    ])
  })

  it('prefers the glibc package on Linux glibc x64', () => {
    expect(getNativePackageCandidates('linux', 'x64', false)).toEqual([
      '@formatjs/cli-native-linux-x64',
      '@formatjs/cli-native-linux-x64-musl',
    ])
  })

  it('prefers the musl package on Linux musl arm64', () => {
    expect(getNativePackageCandidates('linux', 'arm64', true)).toEqual([
      '@formatjs/cli-native-linux-arm64-musl',
      '@formatjs/cli-native-linux-arm64',
    ])
  })

  it('keeps non-Linux package selection unchanged', () => {
    expect(getNativePackageCandidates('darwin', 'arm64', false)).toEqual([
      '@formatjs/cli-native-darwin-arm64',
    ])
  })
})
