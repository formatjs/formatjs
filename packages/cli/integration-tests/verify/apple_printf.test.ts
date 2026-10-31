import {execFile as nodeExecFile} from 'child_process'
import {mkdtemp, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {promisify} from 'util'
import {describe, expect, test} from 'vitest'
import {resolveRustBinaryPath} from '#packages/cli/integration-tests/rust-binary-utils.js'

const execFile = promisify(nodeExecFile)
const nodeCli = require.resolve('@formatjs/cli/bin/formatjs')
const rustCli = resolveRustBinaryPath(import.meta.dirname)

describe.each([
  {name: 'npm', binary: nodeCli},
  {name: 'Rust', binary: rustCli},
])('$name Apple printf validation', ({binary}) => {
  async function verify(source: object, target: object) {
    expect(binary, 'CLI binary must be available').toBeTruthy()
    const directory = await mkdtemp(join(tmpdir(), 'formatjs-apple-printf-'))
    try {
      const sourcePath = join(directory, 'en.json')
      const targetPath = join(directory, 'fr.json')
      await writeFile(sourcePath, JSON.stringify(source))
      await writeFile(targetPath, JSON.stringify(target))
      return await execFile(binary!, [
        'verify',
        sourcePath,
        targetPath,
        '--source-locale',
        'en',
        '--message-syntax',
        'apple-printf',
        '--structural-equality',
      ])
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  }
  test('allows Foundation objects, lengths, reordering, reuse and dynamic arguments', async () => {
    await expect(
      verify(
        {message: '%@ %ld %*.*f %S %C'},
        {message: '%7$C %6$S %5$*3$.*4$e %2$li %1$@ %1$@ %%'}
      )
    ).resolves.toBeTruthy()
  }, 20000)
  test('rejects changed pointer types and integer lengths', async () => {
    await expect(
      verify({message: '%@ %ld'}, {message: '%s %d'})
    ).rejects.toThrow(
      /fr: message: Incompatible argument 1.*Incompatible argument 2/
    )
  }, 20000)
  test('reports unsupported stringsdict references in source', async () => {
    await expect(verify({plural: '%#@count@'}, {})).rejects.toThrow(
      /en: plural: Invalid Apple printf syntax.*UnsupportedNamedReference/
    )
  }, 20000)
  test('rejects missing value and dynamic width arguments', async () => {
    await expect(verify({message: '%*f'}, {message: '%f'})).rejects.toThrow(
      /Incompatible argument 1.*Missing argument 2/
    )
  }, 20000)
})
