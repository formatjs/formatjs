import {spawnSync} from 'child_process';
import {resolve} from 'path';
import {cpus} from 'os';
import {sync as globSync} from 'glob';

if (process.version.startsWith('v10') || process.version.startsWith('v12')) {
  console.log('Node 10/12 has native Intl.PluralRules');
  process.exit(0);
}

interface TestResult {
  file: string;
  attrs: {
    esid: string;
    description: string;
    info: string;
    features: string[];
    flags: object;
    includes: string[];
  };
  result: {
    pass: boolean;
    message?: string;
  };
}
const PATTERN = resolve(
  __dirname,
  '../../../test262/test/intl402/PluralRules/**/*.js'
);
const testsFiles = globSync(PATTERN).filter(
  fn =>
    // There's no Realm in envs where Intl.PluralRules isn't available (e.g Node 8)
    !fn.includes('proto-from-ctor-realm.js')
);
const args = [
  '--reporter-keys',
  'file,attrs,result',
  '-t',
  String(cpus().length - 1),
  '--prelude',
  './dist/polyfill-with-locales-for-test262.min.js',
  '-r',
  'json',
  // PATTERN,
  ...testsFiles,
];
console.log(`Running "test262-harness ${args.join(' ')}"`);
const result = spawnSync('test262-harness', args, {
  cwd: resolve(__dirname, '..'),
  env: process.env,
  encoding: 'utf-8',
});

const json: TestResult[] = JSON.parse(result.stdout);
if (!json) {
  console.error(result.stderr, result.error);
}
const failedTests = json.filter(r => !r.result.pass);
json.forEach(t => {
  if (t.result.pass) {
    console.log(`✓ ${t.attrs.description}`);
  } else {
    console.log('\n\n');
    console.log(`🗴 ${t.attrs.description}`);
    console.log('\t', t.result.message);
    console.log('\t', resolve(__dirname, '..', t.file));
    console.log('\n\n');
  }
});
if (failedTests.length) {
  console.log(
    `Tests: ${failedTests.length} failed, ${json.length -
      failedTests.length} passed, ${json.length} total`
  );
  process.exitCode = 1;
} else {
  console.log(`Tests: ${json.length} passed, ${json.length} total`);
}
