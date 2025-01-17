import {join} from 'path'
import {promisify} from 'util'
import {exec as nodeExec} from 'child_process'
const exec = promisify(nodeExec)

const BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')

test('misssing keys pass', async () => {
  await expect(
    exec(
      `${BIN_PATH} verify --source-locale en-US --missing-keys '${join(__dirname, 'missing-keys', 'fixtures1', '*.json')}'`
    )
  ).resolves.toBeTruthy()
}, 20000)

test('misssing keys fail', async () => {
  await expect(
    exec(
      `${BIN_PATH} verify --source-locale en-US --missing-keys '${join(__dirname, 'missing-keys', 'fixtures2', '*.json')}'`
    )
  ).rejects.toThrow(/Missing translation keys for locale fr-FR:\nfoo/)
}, 20000)

test('misssing keys fail missing source', async () => {
  await expect(
    exec(
      `${BIN_PATH} verify --source-locale en-US --missing-keys '${join(__dirname, 'missing-keys', 'fixtures3', '*.json')}'`
    )
  ).rejects.toThrow(/ Missing source en-US.json file/)
}, 20000)

test('misssing keys fail nested key', async () => {
  await expect(
    exec(
      `${BIN_PATH} verify --source-locale en-US --missing-keys '${join(__dirname, 'missing-keys', 'fixtures4', '*.json')}'`
    )
  ).rejects.toThrow(/Missing translation keys for locale fr-FR:\nbaz\nbaz.qux/)
}, 20000)

test('structural equality pass', async () => {
  await expect(
    exec(
      `${BIN_PATH} verify --source-locale en-US --structural-equality '${join(__dirname, 'structural-equality', 'fixtures1', '*.json')}'`
    )
  ).resolves.toBeTruthy()
}, 20000)

test('structural equality fail', async () => {
  await expect(
    exec(
      `${BIN_PATH} verify --source-locale en-US --structural-equality '${join(__dirname, 'structural-equality', 'fixtures2', '*.json')}'`
    )
  ).rejects.toThrow(
    /These translation keys for locale fr-FR are structurally different from en-US:\n3\n4\n6/
  )
}, 20000)
