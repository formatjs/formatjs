import types from '@commitlint/config-angular-type-enum'
import fastGlobPkg from 'fast-glob'
import fsExtraPkg from 'fs-extra'
const {readJSONSync} = fsExtraPkg
const {sync: globSync} = fastGlobPkg

const packages = globSync('./packages/*/package.json').map(
  fn => readJSONSync(fn).name
)

export default {
  extends: ['@commitlint/config-angular'],
  rules: {
    // Cheatsheet: https://commitlint.js.org/#/reference-rules
    // Sweet Jesus why is disabling a rule syntax so verbose??
    'scope-enum': [2, 'always', packages],
    'header-max-length': [0, 'never', Infinity],
    'type-enum': [1, 'always', [...types.value(), 'chore']],
  },
}
