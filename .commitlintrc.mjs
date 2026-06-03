import {existsSync, readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

function readPackageName(buildFile) {
  const match = readFileSync(buildFile, 'utf8').match(
    /package_name\s*=\s*"([^"]+)"/
  )
  return match?.[1]
}

function packageScopes() {
  return readdirSync('packages', {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .map(entry => join('packages', entry.name, 'BUILD.bazel'))
    .filter(buildFile => existsSync(buildFile))
    .map(readPackageName)
    .filter(Boolean)
}

function crateScopes() {
  return readdirSync('crates', {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

const packages = [
  ...packageScopes(),
  ...crateScopes(),
  // renovate bot config package
  'deps',
]

export default {
  parserPreset: {
    parserOpts: {headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/},
  },
  rules: {
    // Cheatsheet: https://commitlint.js.org/#/reference-rules
    // Sweet Jesus why is disabling a rule syntax so verbose??
    'subject-exclamation-mark': [2, 'never'],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
    'scope-case': [2, 'always', 'lower-case'],
    'scope-enum': [2, 'always', packages],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'header-max-length': [0, 'never', Infinity],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
  },
}
