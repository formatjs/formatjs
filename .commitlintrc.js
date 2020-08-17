const {sync: globSync} = require('fast-glob');

const packages = globSync('./packages/*/package.json').map(
  fn => require(fn).name
);
// Website is not in `packages`.
packages.push('website');

module.exports = {
  extends: ['@commitlint/config-angular'],
  rules: {
    // Cheatsheet: https://commitlint.js.org/#/reference-rules
    // Sweet Jesus why is disabling a rule syntax so verbose??
    'scope-enum': [2, 'always', packages],
    'header-max-length': [0, 'never', Infinity],
  },
};
