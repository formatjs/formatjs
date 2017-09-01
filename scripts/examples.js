import {sync as globSync} from 'glob';
import {spawnSync} from 'child_process';

const [command, ...args] = process.argv.slice(2);

globSync('./examples/*/').forEach(exampleDir => {
  const opts = {
    cwd: exampleDir,
    stdio: 'inherit',
  };
  let envCommand = command + (/^win/.test(process.platform) ? '.cmd' : '');
  const result = spawnSync(envCommand, args, opts);
  if (result.status !== 0) {
    throw new Error('Linking examples exited with non-zero');
  }
});
