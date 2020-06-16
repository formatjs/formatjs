import {spawnSync} from 'child_process';
import {resolve} from 'path';
import {cpus} from 'os';
import chalk from 'chalk';

if (process.version.startsWith('v13')) {
  console.log(
    'Node 8 does not have Intl.PluralRules and intl-pluralrules is not test262-compliant'
  );
  process.exit(0);
}
if (process.version.startsWith('v14')) {
  console.log('Node >= 12 has native Intl.DateTimeFormat');
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
  rawResult: {
    stderr: string;
    stdout: string;
    error?: Error;
  };
}
const excludedTests = [
  'builtin', // Built-in functions cannot have `prototype` property.
  'constructor-order', // buggy test case. The spec states that impl should throw RangeError.
  'constructor-locales-hasproperty', // This checks that we only iterate once...
  'constructor-unit', // buggy test case. The spec states that impl should throw RangeError.
  'currency-digits', // AFN's currency digits differ from CLDR data.
  'legacy-regexp-statics-not-modified', // TODO
  'proto-from-ctor-realm', // Bc of Realm support
  'constructor-locales-get-tostring', // Bc our Intl.getCanonicalLocales isn't really spec-compliant
  'taint-Object-prototype', // Bc our Intl.getCanonicalLocales isn't really spec-compliant
  'formatRange', // Stage 3
];
// @ts-ignore
const PATTERN = resolve(
  __dirname,
  `../../../test262/test/intl402/DateTimeFormat/**/!(${excludedTests.join(
    '|'
  )}).js`
);
const args = [
  '--reporter-keys',
  'file,attrs,result,rawResult',
  '-t',
  String(cpus().length - 1),
  '--prelude',
  './dist/polyfill-with-locales-for-test262.min.js',
  '-r',
  'json',
  PATTERN,
];
console.log(`Running "test262-harness ${args.join(' ')}"`);
const result = spawnSync('test262-harness', args, {
  cwd: resolve(__dirname, '..'),
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=8192',
  },
  encoding: 'utf-8',
});

let json: TestResult[] | undefined;
try {
  json = JSON.parse(result.stdout);
} catch (e) {
  console.error('STDOUT', result.stdout);
}
if (!json) {
  console.error(result.stderr, result.error);
  process.exit(1);
}
const failedTests = json.filter(r => !r.result.pass);
for (const t of json) {
  if (t.result.pass) {
    // Uncomment if you want to see passed tests
    console.log(`${chalk.green('✓')} ${t.attrs.description}`);
  } else {
    console.log('\n\n');
    console.log(`${chalk.red('✗')} ${t.attrs.description}`);
    console.log(t.rawResult.stdout);
    console.log(chalk.red(t.rawResult.stderr));
    console.log('\t', resolve(__dirname, '..', t.file));
    console.log('\n\n');
  }
}
if (failedTests.length) {
  console.log(
    `Tests: ${failedTests.length} failed, ${
      json.length - failedTests.length
    } passed, ${json.length} total`
  );
  process.exitCode = 1;
} else {
  console.log(`Tests: ${json.length} passed, ${json.length} total`);
}
