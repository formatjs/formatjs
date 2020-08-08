import {exec as nodeExec} from 'child_process';
import {join, resolve} from 'path';
import * as _rimraf from 'rimraf';
import {promisify} from 'util';
const exec = promisify(nodeExec);
const BIN_PATH = resolve(__dirname, '../../bin/formatjs');
const ARTIFACT_PATH = resolve(__dirname, 'test_artifacts');

test('basic case: help', async () => {
  await expect(exec(`${BIN_PATH} compile --help`)).resolves.toMatchSnapshot();
}, 20000);

test('basic case: empty json', async () => {
  await expect(
    exec(`${BIN_PATH} compile ${join(__dirname, 'lang/empty.json')}`)
  ).resolves.toMatchSnapshot();
}, 20000);

test('normal json', async () => {
  await expect(
    exec(`${BIN_PATH} compile ${join(__dirname, 'lang/en.json')}`)
  ).resolves.toMatchSnapshot();
}, 20000);

test('normal json with formatter', async () => {
  await expect(
    exec(
      `${BIN_PATH} compile ${join(
        __dirname,
        'lang/en-format.json'
      )} --format ${join(__dirname, '../formatter.js')}`
    )
  ).resolves.toMatchSnapshot();
}, 20000);

test('normal json with transifex', async () => {
  await expect(
    exec(
      `${BIN_PATH} compile ${join(
        __dirname,
        'lang/en-transifex.json'
      )} --format transifex`
    )
  ).resolves.toMatchSnapshot();
}, 20000);

test('normal json with smartling', async () => {
  await expect(
    exec(
      `${BIN_PATH} compile ${join(
        __dirname,
        'lang/en-smartling.json'
      )} --format smartling`
    )
  ).resolves.toMatchSnapshot();
}, 20000);

test('normal json with simple', async () => {
  await expect(
    exec(
      `${BIN_PATH} compile ${join(
        __dirname,
        'lang/en-simple.json'
      )} --format simple`
    )
  ).resolves.toMatchSnapshot();
}, 20000);

test('normal json with lokalise', async () => {
  await expect(
    exec(
      `${BIN_PATH} compile ${join(
        __dirname,
        'lang/en-lokalise.json'
      )} --format lokalise`
    )
  ).resolves.toMatchSnapshot();
}, 20000);

test('normal json with crowdin', async () => {
  await expect(
    exec(
      `${BIN_PATH} compile ${join(
        __dirname,
        'lang/en-crowdin.json'
      )} --format crowdin`
    )
  ).resolves.toMatchSnapshot();
}, 20000);

test('malformed ICU message json', async () => {
  await expect(
    exec(
      `${BIN_PATH} compile ${join(__dirname, 'lang/malformed-messages.json')}`
    )
  ).rejects.toThrowError('SyntaxError: Expected "," but end of input found.');
}, 20000);

test('AST', async () => {
  await expect(
    exec(`${BIN_PATH} compile --ast ${join(__dirname, 'lang/en.json')}`)
  ).resolves.toMatchSnapshot();
}, 20000);

test('out-file', async () => {
  const outFilePath = join(ARTIFACT_PATH, 'en.json');
  await expect(
    exec(
      `${BIN_PATH} compile ${join(
        __dirname,
        'lang/en.json'
      )} --out-file ${outFilePath}`
    )
  ).resolves.toMatchSnapshot();
  expect(require(outFilePath)).toMatchSnapshot();
}, 20000);

test('out-file --ast', async () => {
  const outFilePath = join(ARTIFACT_PATH, 'ast.json');
  await expect(
    exec(
      `${BIN_PATH} compile --ast ${join(
        __dirname,
        'lang/en.json'
      )} --out-file ${outFilePath}`
    )
  ).resolves.toMatchSnapshot();
  expect(require(outFilePath)).toMatchSnapshot();
}, 20000);

test('compile glob', async () => {
  await expect(
    exec(`${BIN_PATH} compile "${join(__dirname, 'glob/*.json')}"`)
  ).resolves.toMatchSnapshot();
});

test('compile glob with conflict', async () => {
  await expect(
    exec(`${BIN_PATH} compile "${join(__dirname, 'glob-conflict/*.json')}"`)
  ).rejects.toThrowError(
    'Conflicting ID "a1d12" with different translation found in these 2 files'
  );
});
