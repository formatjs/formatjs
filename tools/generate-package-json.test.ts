import {describe, expect, it} from 'vitest'

import {generatePackageJson} from './generate-package-json'

describe('generatePackageJson', () => {
  const rootPackageJson = {
    devDependencies: {
      '@formatjs/icu-messageformat-parser': 'workspace:*',
      '@types/react': '19',
      'babel-plugin-formatjs': 'workspace:*',
      minimist: '^1.2.8',
      react: '19',
      typescript: '6.0.3',
      vite: '^8.0.0',
    },
  }

  it('generates dependency buckets from package names', () => {
    expect(
      generatePackageJson(
        {
          fields: {
            name: 'react-intl',
            version: '1.0.0',
            type: 'module',
            peerDependenciesMeta: {
              react: {
                optional: true,
              },
            },
          },
          dependencies: ['@formatjs/icu-messageformat-parser', 'minimist'],
          peerDependencies: ['react', '@types/react', 'vite'],
          dependencyVersionOverrides: {
            vite: '>=5',
          },
        },
        rootPackageJson
      )
    ).toEqual({
      name: 'react-intl',
      version: '1.0.0',
      type: 'module',
      peerDependenciesMeta: {
        react: {
          optional: true,
        },
      },
      dependencies: {
        '@formatjs/icu-messageformat-parser': 'workspace:*',
        minimist: '^1.2.8',
      },
      peerDependencies: {
        '@types/react': '19',
        react: '19',
        vite: '>=5',
      },
    })
  })

  it('uses dependency version overrides from package metadata', () => {
    expect(
      generatePackageJson(
        {
          fields: {
            name: 'react-app-rewired',
          },
          dependencies: ['minimist', 'react'],
          dependencyVersionOverrides: {
            minimist: '^1.0.0',
          },
        },
        rootPackageJson
      )
    ).toEqual({
      name: 'react-app-rewired',
      dependencies: {
        minimist: '^1.0.0',
        react: '19',
      },
    })
  })

  it('rejects dependency version overrides for workspace dependencies', () => {
    expect(() =>
      generatePackageJson(
        {
          fields: {
            name: '@formatjs/example',
          },
          dependencies: ['babel-plugin-formatjs'],
          dependencyVersionOverrides: {
            'babel-plugin-formatjs': '^9.0.0',
          },
        },
        rootPackageJson
      )
    ).toThrow(
      'dependencyVersionOverrides must not override workspace dependency version(s): babel-plugin-formatjs'
    )
  })

  it('rejects package-local devDependencies', () => {
    expect(() =>
      generatePackageJson(
        {
          fields: {
            name: '@formatjs/example',
          },
          devDependencies: ['typescript'],
        },
        rootPackageJson
      )
    ).toThrow(
      'devDependencies must live in the root package.json, not package manifests'
    )
  })

  it('rejects gitHead metadata', () => {
    expect(() =>
      generatePackageJson(
        {
          fields: {
            name: '@formatjs/example',
            gitHead: 'abc123',
          },
        },
        rootPackageJson
      )
    ).toThrow('gitHead must not be set in generated package.json metadata')
  })

  it('fails when a dependency version is unknown', () => {
    expect(() =>
      generatePackageJson(
        {
          fields: {
            name: '@formatjs/example',
          },
          dependencies: ['missing'],
        },
        rootPackageJson
      )
    ).toThrow('No version found for missing')
  })

  it('rejects dependency version overrides for undeclared dependencies', () => {
    expect(() =>
      generatePackageJson(
        {
          fields: {
            name: '@formatjs/example',
          },
          dependencies: ['react'],
          dependencyVersionOverrides: {
            missing: '^1.0.0',
          },
        },
        rootPackageJson
      )
    ).toThrow('dependencyVersionOverrides contains unused override(s): missing')
  })

  it('rejects static dependency sections', () => {
    expect(() =>
      generatePackageJson(
        {
          fields: {
            name: '@formatjs/example',
            dependencies: {},
          },
        },
        rootPackageJson
      )
    ).toThrow('dependencies must be generated from Bazel labels')
  })
})
