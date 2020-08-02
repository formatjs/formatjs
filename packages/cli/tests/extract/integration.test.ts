import {resolve, join} from 'path';
import {promisify} from 'util';
import {exec as nodeExec} from 'child_process';
import {readJSON, mkdirp} from 'fs-extra';
import * as _rimraf from 'rimraf';
const exec = promisify(nodeExec);
const rimraf = promisify(_rimraf);

const BIN_PATH = resolve(__dirname, '../../bin/formatjs');
const ARTIFACT_PATH = resolve(__dirname, 'test_artifacts');

beforeEach(async () => {
  await mkdirp(join(__dirname, 'test_artifacts'));
  await rimraf(ARTIFACT_PATH);
});

test('basic case: help', async () => {
  const {stdout, stderr} = await exec(`${BIN_PATH} extract --help`);
  expect(stdout).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('basic case: defineMessages -> stdout', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract --throws ${join(
      __dirname,
      'defineMessages/actual.js'
    )}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('[glob] basic case: defineMessages -> stdout', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract ${join(__dirname, 'defineMessages/*.js')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('basic case: defineMessages -> out-file', async () => {
  process.chdir(__dirname);
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract defineMessages/actual.js --out-file ${ARTIFACT_PATH}/defineMessages/actual.json`
  );
  expect(stdout).toBe('');
  expect(stderr).toBe('');

  expect(
    await readJSON(join(ARTIFACT_PATH, 'defineMessages/actual.json'))
  ).toMatchSnapshot();
}, 20000);

test('basic case: defineMessages -> out-file with location', async () => {
  process.chdir(__dirname);
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract defineMessages/actual.js --extract-source-location --out-file ${ARTIFACT_PATH}/defineMessages/actual.json`
  );
  expect(stdout).toBe('');
  expect(stderr).toBe('');

  expect(
    await readJSON(join(ARTIFACT_PATH, 'defineMessages/actual.json'))
  ).toMatchSnapshot();
}, 20000);

test('typescript -> stdout', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract ${join(__dirname, 'typescript/actual.tsx')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('typescript -> stdout with formatter', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract ${join(
      __dirname,
      'typescript/actual.tsx'
    )} --format ${join(__dirname, '../formatter.js')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('typescript -> stdout with transifex', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract ${join(
      __dirname,
      'typescript/actual.tsx'
    )} --format transifex`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('typescript -> stdout with smartling', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract ${join(
      __dirname,
      'typescript/actual.tsx'
    )} --format smartling`
  );
  // Don't parse bc re-parsing re-sort the keys
  expect(stdout).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

const ignore = "--ignore '*.ignore.*'";

test('ignore -> stdout TS', async () => {
  const tsResult = await exec(
    `${BIN_PATH} extract --throws ${join(
      __dirname,
      'typescript/actual.tsx'
    )} ${ignore}`
  );
  expect(JSON.parse(tsResult.stdout)).toMatchSnapshot();
  expect(tsResult.stderr).toBe('');
}, 20000);

test('ignore -> stdout JS', async () => {
  const jsResult = await exec(
    `${BIN_PATH} extract '${join(__dirname, 'defineMessages/*.js')}' ${ignore}`
  );
  expect(JSON.parse(jsResult.stdout)).toMatchSnapshot();
  expect(jsResult.stderr).toBe('');
}, 20000);

test('duplicated descriptor ids shows warning', async () => {
  const {stderr, stdout} = await exec(
    `${BIN_PATH} extract '${join(__dirname, 'duplicated/*.tsx')}'`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toContain('Duplicate message id: "foo"');
}, 20000);

test('duplicated descriptor ids throws', async () => {
  expect(async () => {
    await exec(
      `${BIN_PATH} extract --throws '${join(__dirname, 'duplicated/*.tsx')}'`
    );
  }).rejects.toThrowError('Duplicate message id: "foo"');
}, 20000);
