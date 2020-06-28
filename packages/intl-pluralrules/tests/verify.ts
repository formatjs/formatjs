import * as minimist from 'minimist';
import {resolve} from 'path';
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

function main(args: minimist.ParsedArgs) {
  const {result} = args;
  console.log(resolve(result));
  const json: TestResult[] = require(resolve(result));
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
      `Tests: ${failedTests.length} failed, ${
        json.length - failedTests.length
      } passed, ${json.length} total`
    );
    process.exitCode = 1;
  } else {
    console.log(`Tests: ${json.length} passed, ${json.length} total`);
  }
}

if (require.main === module) {
  main(minimist(process.argv));
}
