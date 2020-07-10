const {execFileSync} = require('child_process');
const minimist = require('minimist');
const cli = require.resolve('@docusaurus/core/bin/docusaurus');
function main(args) {
  console.log(__dirname, cli, args);
  execFileSync(cli, ['build'], {
    cwd: __dirname,
    env: {
      ...process.env,
      USE_SSH: true,
    },
  });
}

if (require.main === module) {
  main(minimist(process.argv));
}
