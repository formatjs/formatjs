import fastGlobPkg from 'fast-glob'
import {readJSONSync} from 'fs-extra/esm'
import {dirname} from 'node:path'
const {sync: globSync} = fastGlobPkg

const packages = [
  ...globSync('./packages/*/package.json').map(fn => readJSONSync(fn).name),
  ...globSync('./rust/*/BUILD.bazel').map(fn => dirname(fn).split('rust/')[1]),
  // renovate bot config package
  'deps',
]

export default {
  extends: ['@commitlint/config-angular'],
  rules: {
    // Cheatsheet: https://commitlint.js.org/#/reference-rules
    // Sweet Jesus why is disabling a rule syntax so verbose??
    'scope-enum': [2, 'always', packages],
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
