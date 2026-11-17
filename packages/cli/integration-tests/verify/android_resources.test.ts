import {execFile as nodeExecFile} from 'child_process'
import {mkdir, mkdtemp, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {promisify} from 'util'
import {describe, expect, test} from 'vitest'
import {resolveRustBinaryPath} from '#packages/cli/integration-tests/rust-binary-utils.js'

const execFile = promisify(nodeExecFile)

describe.each([
  {name: 'npm', binary: require.resolve('@formatjs/cli/bin/formatjs')},
  {name: 'Rust', binary: resolveRustBinaryPath(import.meta.dirname)},
])('$name Android resource verification', ({binary}) => {
  test('checks native XML, Android escapes and printf compatibility', async () => {
    expect(binary, 'CLI binary must be available').toBeTruthy()
    const directory = await mkdtemp(join(tmpdir(), 'formatjs-android-'))
    const resource = (text: string) =>
      `<resources><string name="message">${text}</string></resources>`
    try {
      await mkdir(join(directory, 'values'))
      await mkdir(join(directory, 'values-fr'))
      await writeFile(
        join(directory, 'values/strings.xml'),
        resource('%1$s %2$d')
      )
      const target = join(directory, 'values-fr/strings.xml')
      await writeFile(target, resource('"L&apos;histoire %2$d %1$s"'))
      const run = () =>
        execFile(binary!, [
          'verify',
          join(directory, '**/*.xml'),
          '--message-syntax',
          'android',
          '--source-locale',
          'en',
          '--structural-equality',
          '--missing-keys',
          '--extra-keys',
        ])
      await expect(run()).resolves.toBeTruthy()
      await writeFile(target, resource('L’histoire %2$d %1$s'))
      await expect(run()).resolves.toBeTruthy()
      await writeFile(target, resource("L'histoire %2$d %1$s"))
      await expect(run()).rejects.toThrow(/apostrophe/)
      await writeFile(target, resource('%1$d %2$d'))
      await expect(run()).rejects.toThrow(/Incompatible argument 1/)
      await writeFile(target, resource('&nbsp; %1$s %2$d'))
      await expect(run()).rejects.toThrow(/XML/)
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })
})
