import {mkdtemp, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {compile} from '#packages/cli-lib/compile'
import {
  compileMessagesWithNative,
  type NativeCompileMessage,
} from '#packages/cli-lib/native.js'

vi.mock('#packages/cli-lib/native.js', () => ({
  compileMessagesWithNative: vi.fn((messages: NativeCompileMessage[]) =>
    JSON.stringify(
      Object.fromEntries(messages.map(({id, message}) => [id, message]))
    )
  ),
  compileWithNative: vi.fn(),
}))

describe('compile()', () => {
  let testDir: string | undefined

  afterEach(async () => {
    vi.clearAllMocks()
    if (testDir) {
      await rm(testDir, {force: true, recursive: true})
      testDir = undefined
    }
  })

  it('resolves globbed files for custom formatters', async () => {
    testDir = await mkdtemp(join(tmpdir(), 'formatjs-cli-lib-'))
    await writeFile(
      join(testDir, 'messages.json'),
      JSON.stringify({hello: 'Hello World'})
    )

    const result = await compile([join(testDir, '*.json')], {
      format: {
        format(messages: unknown) {
          return messages
        },
        compile(messages: unknown) {
          return messages as Record<string, string>
        },
      },
    })

    expect(JSON.parse(result)).toEqual({hello: 'Hello World'})
    expect(compileMessagesWithNative).toHaveBeenCalledWith(
      [
        {
          id: 'hello',
          message: 'Hello World',
          sourceFile: join(testDir, 'messages.json'),
        },
      ],
      {
        ast: undefined,
        ignoreTag: undefined,
        pseudoLocale: undefined,
        skipErrors: undefined,
      }
    )
  })
})
