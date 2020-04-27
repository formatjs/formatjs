import {spawnSync} from 'child_process';
import {resolve} from 'path';
import {cpus} from 'os';

if (!process.version.startsWith('v10')) {
  console.log(
    `Only run on Node 10 since: 
- Node 8 does not have Intl.PluralRules and polyfills are not test262-compliant.
- Node 12+ has native Intl.ListFormat.
`
  );
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
const excludedTests = [
  'options-undefined', // TODO
  'options-toobject-prototype', // TODO
  'locales-valid', // f7e8dba39b1143b45c37ee137e406889b56bc335 added grandfathered locale which we
  'proto-from-ctor-realm', // Bc of Realm support
];
const PATTERN = resolve(
  __dirname,
  `../../../test262/test/intl402/ListFormat/**/!(${excludedTests.join('|')}).js`
);
const args = [
  '--reporter-keys',
  'file,attrs,result',
  '-t',
  String(cpus().length - 1),
  '--prelude',
  './dist/polyfill-with-locales-for-test262.js',
  '-r',
  'json',
  PATTERN,
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
  process.exit(1);
}
const failedTests = json.filter(r => !r.result.pass);
json.forEach(t => {
  if (t.result.pass) {
    console.log(`✓ ${t.attrs.description}`);
  } else {
    console.log(`
🗴 ${t.attrs.description}
    ${t.result.message}
    ${resolve(__dirname, '..', t.file)}
`);
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
