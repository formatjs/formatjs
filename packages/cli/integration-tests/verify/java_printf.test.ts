import {execFile as nodeExecFile} from 'child_process'
import {mkdtemp, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {promisify} from 'util'
import {afterEach, beforeEach, describe, expect, test} from 'vitest'
import {resolveRustBinaryPath} from '#packages/cli/integration-tests/rust-binary-utils.js'

const execFile = promisify(nodeExecFile)
const nodeCli = require.resolve('@formatjs/cli/bin/formatjs')
const rustCli = resolveRustBinaryPath(import.meta.dirname)

describe.each([
  {name: 'npm', binary: nodeCli},
  {name: 'Rust', binary: rustCli},
])('$name Java printf validation', ({binary}) => {
  let directory: string
  let source: string
  let target: string
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'formatjs-java-printf-'))
    source = join(directory, 'en.json')
    target = join(directory, 'fr.json')
  })
  afterEach(async () => {
    await rm(directory, {recursive: true, force: true})
  })
  async function verify(
    sourceCatalog: object,
    targetCatalog: object,
    syntax: string | null = 'java-printf',
    ...options: string[]
  ) {
    expect(binary, 'CLI binary must be available').toBeTruthy()
    await writeFile(source, JSON.stringify(sourceCatalog))
    await writeFile(target, JSON.stringify(targetCatalog))
    const args = [
      'verify',
      source,
      target,
      '--source-locale',
      'en',
      '--structural-equality',
    ]
    if (syntax) args.push('--message-syntax', syntax)
    return execFile(binary!, [...args, ...options])
  }
  test('allows explicit reordering, previous references, date formats and literal braces', async () => {
    await expect(
      verify(
        {message: '%s %d %3$tY {name}'},
        {message: '%3$tF %2$x %1$S %<s {autre} %% %n'}
      )
    ).resolves.toBeTruthy()
  }, 20000)
  test('rejects missing arguments and incompatible requirements with message IDs', async () => {
    await expect(verify({message: '%s %d'}, {message: '%1$d'})).rejects.toThrow(
      /fr: message: Incompatible argument 1.*Missing argument 2/
    )
  }, 20000)
  test('rejects malformed source even without matching target key', async () => {
    await expect(verify({broken: '%q'}, {})).rejects.toThrow(
      /en: broken: Invalid Java printf syntax/
    )
  }, 20000)
  test('checks missing and extra keys alongside argument requirements', async () => {
    await expect(
      verify(
        {missing: '%s'},
        {extra: '%d'},
        'java-printf',
        '--missing-keys',
        '--extra-keys'
      )
    ).rejects.toThrow(/Missing translation keys/)
  }, 20000)
  test('requires an explicit Java printf syntax selection', async () => {
    await expect(
      verify({message: '%s'}, {message: '%d'}, null)
    ).resolves.toBeTruthy()
    await expect(verify({}, {}, 'unknown')).rejects.toThrow()
  }, 20000)
})
