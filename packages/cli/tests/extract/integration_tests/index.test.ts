import path from 'path';
import util from 'util';
import childProcess from 'child_process';
import {readJSON, mkdirp, readdir} from 'fs-extra';
import _rimraf from 'rimraf';
const exec = util.promisify(childProcess.exec);
const rimraf = util.promisify(_rimraf);

const BIN_PATH = path.resolve(__dirname, '../../../bin/formatjs');
const ARTIFACT_PATH = path.resolve(__dirname, 'test_artifacts');

beforeEach(async () => {
  await mkdirp(path.join(__dirname, 'test_artifacts'));
  await rimraf(ARTIFACT_PATH);
});

test('basic case: help', async () => {
  const {stdout, stderr} = await exec(`${BIN_PATH} extract --help`);
  expect(stdout).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('basic case: defineMessages -> stdout', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract ${path.join(__dirname, 'defineMessages/actual.js')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('[glob] basic case: defineMessages -> stdout', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract ${path.join(__dirname, 'defineMessages/*.js')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('basic case: defineMessages -> directory', async () => {
  process.chdir(__dirname);
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract defineMessages/actual.js --messages-dir ${ARTIFACT_PATH}`
  );
  expect(stdout).toBe('');
  expect(stderr).toBe('');
  // Write to test_artifacts/defineMessages/actual.json
  expect(
    await readdir(path.join(ARTIFACT_PATH, 'defineMessages'))
  ).toMatchSnapshot();
  expect(
    await readJSON(path.join(ARTIFACT_PATH, 'defineMessages/actual.json'))
  ).toMatchSnapshot();
}, 20000);

test('basic case: defineMessages -> directory with location', async () => {
  process.chdir(__dirname);
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract defineMessages/actual.js --extract-source-location --messages-dir ${ARTIFACT_PATH}`
  );
  expect(stdout).toBe('');
  expect(stderr).toBe('');
  // Write to test_artifacts/defineMessages/actual.json
  expect(
    await readdir(path.join(ARTIFACT_PATH, 'defineMessages'))
  ).toMatchSnapshot();
  expect(
    await readJSON(path.join(ARTIFACT_PATH, 'defineMessages/actual.json'))
  ).toMatchSnapshot();
}, 20000);

test('typescript -> stdout', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} extract ${path.join(__dirname, 'typescript/actual.tsx')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('ignore -> stdout', async () => {
  const ignore = "--ignore '*.ignore.*'";

  const tsResult = await exec(
    `${BIN_PATH} extract ${path.join(
      __dirname,
      'typescript/actual.tsx'
    )} ${ignore}`
  );
  expect(JSON.parse(tsResult.stdout)).toMatchSnapshot();
  expect(tsResult.stderr).toBe('');

  const jsResult = await exec(
    `${BIN_PATH} extract ${path.join(
      __dirname,
      'defineMessages/*.js'
    )} ${ignore}`
  );
  expect(JSON.parse(jsResult.stdout)).toMatchSnapshot();
  expect(jsResult.stderr).toBe('');
}, 20000);

test('duplicated descriptor ids shows warning', async () => {
  const {stderr, stdout} = await exec(
    `${BIN_PATH} extract ${path.join(__dirname, 'duplicated/*.tsx')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toContain('Duplicate message id: "foo"');
}, 20000);

test('duplicated descriptor ids throws', async () => {
  expect(async () => {
    await exec(
      `${BIN_PATH} extract --throws ${path.join(__dirname, 'duplicated/*.tsx')}`
    );
  }).rejects.toThrowError('Duplicate message id: "foo"');
}, 20000);
