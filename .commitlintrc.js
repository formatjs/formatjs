const {sync: globSync} = require('glob');

const packages = globSync('./packages/*/package.json').map(
  fn => require(fn).name
);

module.exports = {
  extends: ['@commitlint/config-angular'],
  'scope-enum': packages,
};
