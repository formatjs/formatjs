import {mkdirp} from 'fs-extra';
import {exec as nodeExec} from 'child_process';
import {join, resolve} from 'path';
import * as _rimraf from 'rimraf';
import {promisify} from 'util';
const exec = promisify(nodeExec);
const rimraf = promisify(_rimraf);
const BIN_PATH = resolve(__dirname, '../../../bin/formatjs');
const ARTIFACT_PATH = resolve(__dirname, 'test_artifacts');

beforeEach(async () => {
  await mkdirp(join(__dirname, 'test_artifacts'));
  await rimraf(ARTIFACT_PATH);
});

test('basic case: help', async () => {
  const {stdout, stderr} = await exec(`${BIN_PATH} compile --help`);
  expect(stdout).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('basic case: empty json', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} compile ${join(__dirname, 'lang/empty.json')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('normal json', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} compile ${join(__dirname, 'lang/en.json')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('malformed ICU message json', async () => {
  expect(async () => {
    await exec(
      `${BIN_PATH} compile ${join(__dirname, 'lang/malformed-messages.json')}`
    );
  }).rejects.toThrowError('SyntaxError: Expected "," but end of input found.');
}, 20000);

test('AST', async () => {
  const {stdout, stderr} = await exec(
    `${BIN_PATH} compile --ast ${join(__dirname, 'lang/en.json')}`
  );
  expect(JSON.parse(stdout)).toMatchSnapshot();
  expect(stderr).toBe('');
}, 20000);

test('out-file', async () => {
  const outFilePath = join(ARTIFACT_PATH, 'en.json');
  const {stdout, stderr} = await exec(
    `${BIN_PATH} compile ${join(
      __dirname,
      'lang/en.json'
    )} --out-file ${outFilePath}`
  );
  expect(stdout).toBe('');
  expect(stderr).toBe('');
  expect(require(outFilePath)).toMatchSnapshot();
}, 20000);

test('out-file --ast', async () => {
  const outFilePath = join(ARTIFACT_PATH, 'ast.json');
  const {stdout, stderr} = await exec(
    `${BIN_PATH} compile --ast ${join(
      __dirname,
      'lang/en.json'
    )} --out-file ${outFilePath}`
  );
  expect(stdout).toBe('');
  expect(stderr).toBe('');
  expect(require(outFilePath)).toMatchSnapshot();
}, 20000);
