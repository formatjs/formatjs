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
  test('preserves custom references when checking structural equality', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'formatjs-entities-'))
    const resource = (text: string) =>
      `<!DOCTYPE resources [<!ENTITY brand "Example"><!ENTITY otherBrand "Other">]><resources><string name="s" formatted="false">${text}</string></resources>`
    try {
      await mkdir(join(directory, 'values'))
      await mkdir(join(directory, 'values-fr'))
      await writeFile(
        join(directory, 'values/strings.xml'),
        resource('&brand; &otherBrand; &brand;')
      )
      const target = join(directory, 'values-fr/strings.xml')
      await writeFile(target, resource('Example Other Example'))
      const run = (structural: boolean) =>
        execFile(binary!, [
          'verify',
          join(directory, '**/*.xml'),
          '--source-locale',
          'en',
          '--message-syntax',
          'android',
          ...(structural ? ['--structural-equality'] : []),
        ])
      await expect(run(false)).resolves.toBeTruthy()
      await expect(run(true)).rejects.toThrow(/entity references changed/)
      await writeFile(target, resource('&otherBrand; &brand; &brand;'))
      await expect(run(true)).resolves.toBeTruthy()
      await writeFile(target, resource('&otherBrand; &brand;'))
      await expect(run(true)).rejects.toThrow(/entity references changed/)
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })
  test('preserves native markup and resource references under structural equality', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'formatjs-structure-'))
    const resource = (text: string) =>
      `<resources><string name="s" formatted="false">${text}</string></resources>`
    try {
      await mkdir(join(directory, 'values'))
      await mkdir(join(directory, 'values-fr'))
      const source = join(directory, 'values/strings.xml')
      const target = join(directory, 'values-fr/strings.xml')
      const run = (structural = true) =>
        execFile(binary!, [
          'verify',
          join(directory, '**/*.xml'),
          '--source-locale',
          'en',
          '--message-syntax',
          'android',
          ...(structural ? ['--structural-equality'] : []),
        ])
      await writeFile(
        source,
        resource('<b><i>100%</i></b><font color="red">Hi</font>')
      )
      await writeFile(
        target,
        resource('<font color="red">Salut</font><b><i>100%</i></b>')
      )
      await expect(run()).resolves.toBeTruthy()
      await writeFile(
        target,
        resource('<font color="blue">Salut</font><i><b>100%</b></i>')
      )
      await expect(run(false)).resolves.toBeTruthy()
      await expect(run()).rejects.toThrow(/markup changed/)
      await writeFile(source, resource('@string/name'))
      await writeFile(target, resource('"@string/name"'))
      await expect(run(false)).resolves.toBeTruthy()
      await expect(run()).rejects.toThrow(/resource reference changed/)
      await writeFile(target, resource('@string/other'))
      await expect(run()).rejects.toThrow(/resource reference changed/)
      await writeFile(target, resource('&#64;string/name'))
      await expect(run()).resolves.toBeTruthy()
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })
})
