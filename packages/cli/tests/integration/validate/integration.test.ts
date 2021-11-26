import {resolve, join} from 'path'
import {promisify} from 'util'
import {exec as nodeExec} from 'child_process'
import {mkdirp} from 'fs-extra'
import _rimraf from 'rimraf'
const exec = promisify(nodeExec)
const rimraf = promisify(_rimraf)

const BIN_PATH = resolve(__dirname, '../../../bin/formatjs')
const ARTIFACT_PATH = resolve(__dirname, 'test_artifacts')

beforeEach(async () => {
  await mkdirp(join(__dirname, 'test_artifacts'))
  await rimraf(ARTIFACT_PATH)
})

test('basic case: help', async () => {
  await expect(exec(`${BIN_PATH} validate --help`)).resolves.toMatchSnapshot()
}, 20000)

test('basic case: good', async () => {
  await expect(
    exec(
      `${BIN_PATH} validate ${join(
        __dirname,
        'good/actual.js'
      )} --in-file ${join(__dirname, 'good/en.json')}`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('basic case: additional translation', async () => {
  await expect(
    exec(
      `${BIN_PATH} validate ${join(
        __dirname,
        'additional-translation/actual.js'
      )} --in-file ${join(__dirname, 'additional-translation/en.json')}`
    )
  ).rejects.toMatchSnapshot()
}, 20000)

test('basic case: missing translation', async () => {
  await expect(
    exec(
      `${BIN_PATH} validate ${join(
        __dirname,
        'missing-translation/actual.js'
      )} --in-file ${join(__dirname, 'missing-translation/en.json')}`
    )
  ).rejects.toMatchSnapshot()
}, 20000)

test('basic case: message differs', async () => {
  await expect(
    exec(
      `${BIN_PATH} validate ${join(
        __dirname,
        'message-differs/actual.js'
      )} --in-file ${join(__dirname, 'message-differs/en.json')}`
    )
  ).rejects.toMatchSnapshot()
}, 20000)
