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
const unit = (value: string) => ({stringUnit: {state: 'translated', value}})
const catalog = (en: object, fr: object) => ({
  sourceLanguage: 'en',
  version: '1.0',
  strings: {message: {localizations: {en, fr}}},
})

describe.each([
  {name: 'npm', binary: nodeCli},
  {name: 'Rust', binary: rustCli},
])('$name xcstrings validation', ({binary}) => {
  async function verify(
    value: object,
    options: string[] = [],
    extension = 'xcstrings'
  ) {
    expect(binary, 'CLI binary must be available').toBeTruthy()
    const directory = await mkdtemp(join(tmpdir(), 'formatjs-xcstrings-'))
    try {
      const file = join(directory, `Localizable.${extension}`)
      await writeFile(file, JSON.stringify(value))
      return await execFile(binary!, [
        'verify',
        file,
        '--message-syntax',
        'apple-printf',
        '--structural-equality',
        ...options,
      ])
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  }
  test('reads one multilingual catalog and infers sourceLanguage', async () => {
    await expect(
      verify(
        catalog(
          unit('%@ %ld %*.*f %S %C'),
          unit('%7$C %6$S %5$*3$.*4$e %2$li %1$@ %1$@ %%')
        )
      )
    ).resolves.toBeTruthy()
    await expect(
      verify({
        sourceLanguage: 'en',
        version: '1.0',
        strings: {'%@': {localizations: {fr: unit('%1$@')}}},
      })
    ).resolves.toBeTruthy()
  }, 20000)
  test('reports file, locale and key for pointer and integer length changes', async () => {
    await expect(
      verify(catalog(unit('%@ %ld'), unit('%s %d')))
    ).rejects.toThrow(
      /fr: .*Localizable.xcstrings: message: .*Incompatible argument 1.*Incompatible argument 2/
    )
  }, 20000)
  test('supports locale-specific plurals and named substitution metadata', async () => {
    const plural = (one: string, other: string) => ({
      variations: {plural: {one: unit(one), other: unit(other)}},
    })
    await expect(
      verify(
        catalog(plural('One item', '%lld items'), {
          variations: {
            plural: {few: unit('%lld éléments'), other: unit('%lld éléments')},
          },
        })
      )
    ).resolves.toBeTruthy()
    const source = {
      stringUnit: {value: '%#@items@'},
      substitutions: {
        items: {
          argNum: 1,
          formatSpecifier: 'lld',
          ...plural('One item', '%arg items'),
        },
      },
    }
    const target = {
      stringUnit: {value: '%#@items@'},
      substitutions: {
        items: {
          argNum: 1,
          formatSpecifier: 'lld',
          ...plural('Un élément', '%arg éléments'),
        },
      },
    }
    await expect(verify(catalog(source, target))).resolves.toBeTruthy()
    target.substitutions.items.formatSpecifier = 'd'
    await expect(verify(catalog(source, target))).rejects.toThrow(
      /Incompatible argument 1/
    )
  }, 20000)
  test('rejects flat JSON and explicit source mismatch', async () => {
    await expect(
      verify({message: '%@'}, ['--source-locale', 'en'], 'json')
    ).rejects.toThrow(/only .xcstrings/)
    await expect(
      verify(catalog(unit('%@'), unit('%@')), ['--source-locale', 'de'])
    ).rejects.toThrow(/differs from sourceLanguage/)
  }, 20000)
  test('checks missing localizations without treating plural branches as keys', async () => {
    await expect(
      verify(
        {
          sourceLanguage: 'en',
          version: '1.0',
          strings: {first: {localizations: {fr: unit('premier')}}, second: {}},
        },
        ['--missing-keys', '--extra-keys']
      )
    ).rejects.toThrow(/fr: .*second: Missing translation key/)
  }, 20000)
})
