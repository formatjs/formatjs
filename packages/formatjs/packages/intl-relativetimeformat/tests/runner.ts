import {spawnSync} from 'child_process';
import {resolve} from 'path';
import {cpus} from 'os';
import {sync as globSync} from 'glob';

if (process.version.startsWith('v8')) {
  console.log(
    'Node 8 does not have Intl.PluralRules and intl-pluralrules is not test262-compliant'
  );
  process.exit(0);
}
if (process.version.startsWith('v12')) {
  console.log('Node 12 has native Intl.RelativeTimeFormat');
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
  '../../../test262/test/intl402/RelativeTimeFormat/**/*.js'
);
const testsFiles = globSync(PATTERN).filter(
  // f7e8dba39b1143b45c37ee137e406889b56bc335 added grandfathered locale which we
  // don't deal with
  fn => !fn.includes('constructor/constructor/locales-valid')
);
const args = [
  '--reporter-keys',
  'file,attrs,result',
  '-t',
  String(cpus().length - 1),
  '--prelude',
  './dist/polyfill-with-locales.js',
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
  process.exit(1);
}
console.log(`Tests: ${json.length} passed, ${json.length} total`);
