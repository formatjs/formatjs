import {join} from 'path'
import {promisify} from 'util'
import {exec as nodeExec} from 'child_process'
import {describe, expect, test} from 'vitest'
import {resolveRustBinaryPath} from '../rust-binary-utils'

const exec = promisify(nodeExec)

const TS_BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')
const RUST_BIN_PATH = resolveRustBinaryPath(__dirname)

describe.each([
  {name: 'TypeScript', binPath: TS_BIN_PATH, isRust: false},
  {name: 'Rust', binPath: RUST_BIN_PATH, isRust: true},
])('$name CLI', ({binPath, isRust}) => {
  test('missing keys pass', async () => {
    await expect(
      exec(
        `${binPath} verify --source-locale en-US --ignore '${join(__dirname, 'missing-keys', 'fixtures1', 'es.json')}' --missing-keys '${join(__dirname, 'missing-keys', 'fixtures1', '*.json')}'`
      )
    ).resolves.toBeTruthy()
  }, 20000)

  test('missing keys fail', async () => {
    await expect(
      exec(
        `${binPath} verify --source-locale en-US --missing-keys '${join(__dirname, 'missing-keys', 'fixtures2', '*.json')}'`
      )
    ).rejects.toThrow(/Missing translation keys for locale fr-FR:\nfoo/)
  }, 20000)

  test('missing keys fail missing source', async () => {
    await expect(
      exec(
        `${binPath} verify --source-locale en-US --missing-keys '${join(__dirname, 'missing-keys', 'fixtures3', '*.json')}'`
      )
    ).rejects.toThrow(/ Missing source en-US.json file/)
  }, 20000)

  test('missing keys fail nested key', async () => {
    await expect(
      exec(
        `${binPath} verify --source-locale en-US --missing-keys '${join(__dirname, 'missing-keys', 'fixtures4', '*.json')}'`
      )
    ).rejects.toThrow(
      /Missing translation keys for locale fr-FR:\nbaz\nbaz.qux/
    )
  }, 20000)

  test('structural equality pass', async () => {
    await expect(
      exec(
        `${binPath} verify --source-locale en-US --structural-equality '${join(__dirname, 'structural-equality', 'fixtures1', '*.json')}'`
      )
    ).resolves.toBeTruthy()
  }, 20000)

  test('structural equality fail', async () => {
    let errMessage = isRust
      ? `These translation keys for locale fr-FR are structurally different from en-US:
3: [3] Missing variable var of type number in message
4: [4] Missing variable var4 of type time in message
6: Different number of variables: [var, var2, var3, var4, var5, b] vs [var, var2, var3, var4, var5]
7: EXPECT_ARGUMENT_CLOSING_BRACE`
      : `These translation keys for locale fr-FR are structurally different from en-US:
3: Variable var has conflicting types: number vs date
4: Missing variable var4 in message
6: Different number of variables: [var, var2, var3, var4, var5, b] vs [var, var2, var3, var4, var5]
7: EXPECT_ARGUMENT_CLOSING_BRACE`
    await expect(
      exec(
        `${binPath} verify --source-locale en-US --structural-equality '${join(__dirname, 'structural-equality', 'fixtures2', '*.json')}'`
      )
    ).rejects.toThrow(errMessage)
  }, 20000)

  test('extra keys pass', async () => {
    await expect(
      exec(
        `${binPath} verify --source-locale en-US --extra-keys '${join(__dirname, 'extra-keys', 'fixtures1', '*.json')}'`
      )
    ).resolves.toBeTruthy()
  }, 20000)

  test('extra keys fail', async () => {
    await expect(
      exec(
        `${binPath} verify --source-locale en-US --extra-keys '${join(__dirname, 'extra-keys', 'fixtures2', '*.json')}'`
      )
    ).rejects.toThrow(/Extra translation keys for locale fr-FR:\nboo/)
  }, 20000)
})
