import fastGlobPkg from 'fast-glob'
import {readJSONSync} from 'fs-extra/esm'
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
  },
}
