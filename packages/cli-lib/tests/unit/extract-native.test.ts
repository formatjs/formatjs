import type * as FsPromises from 'fs/promises'
import type * as Native from '#packages/cli-lib/native.js'
import type * as ConsoleUtils from '#packages/cli-lib/console_utils.js'
import {mkdtemp, readFile, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import extractAndWrite, {
  extract,
  type ExtractOpts,
} from '#packages/cli-lib/extract.js'
import {extractFilesWithNative} from '#packages/cli-lib/native.js'
import {getStdinAsString} from '#packages/cli-lib/console_utils.js'

vi.mock('fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof FsPromises>()
  return {...actual, readFile: vi.fn(actual.readFile)}
})
vi.mock('#packages/cli-lib/native.js', async importOriginal => {
  const actual = await importOriginal<typeof Native>()
  return {
    ...actual,
    extractFilesWithNative: vi.fn(actual.extractFilesWithNative),
  }
})

vi.mock('#packages/cli-lib/console_utils.js', async importOriginal => ({
  ...(await importOriginal<typeof ConsoleUtils>()),
  getStdinAsString: vi.fn(
    async () => "defineMessage({id: 'stdin', defaultMessage: 'Stdin'})"
  ),
}))

const actualFs = await vi.importActual<typeof FsPromises>('fs/promises')

const compatibleOptions: ExtractOpts[] = [
  {},
  {throws: true},
  {format: 'simple'},
  {format: 'crowdin'},
  {format: 'lokalise'},
  {format: 'smartling'},
  {format: 'transifex'},
  {idInterpolationPattern: '[sha256:contenthash:hex:12]'},
  {overrideIdFn: '[sha1:contenthash:hex:8]'},
  {pragma: '@intl-meta'},
  {preserveWhitespace: true, flatten: true},
  {
    additionalFunctionNames: ['translate'],
    additionalComponentNames: ['Localized'],
  },
  {
    format: {
      format: messages => messages,
      compile: () => ({}),
      serialize: messages => `catalog:${JSON.stringify(messages)}`,
    },
  },
]

describe('native file extraction', () => {
  let tempDir: string
  let files: string[]

  beforeEach(async () => {
    vi.clearAllMocks()
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-native-files-'))
    files = [join(tempDir, 'z.tsx'), join(tempDir, 'a[1].tsx')]
    await writeFile(
      files[0],
      `// @intl-meta project:test
      defineMessage({defaultMessage: 'Hello   world', description: {context: 'Greeting'}})
      defineMessage({id: 'plural', defaultMessage: 'Hello {count, plural, one {person} other {people}}'})
      translate({id: 'custom.function', defaultMessage: 'Custom'})
      const label = <Localized id="custom.component" defaultMessage="Component" />
      const standard = <$formatMessage id="dollar.component" defaultMessage="Dollar" />
    `
    )
    await writeFile(
      files[1],
      "defineMessage({id: 'last', defaultMessage: 'Last'})"
    )
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(tempDir, {recursive: true, force: true})
  })

  it.each(compatibleOptions)(
    'matches Node output for %j without Node reads',
    async options => {
      const nativeResult = await extract(files, options)
      expect(extractFilesWithNative).toHaveBeenCalledOnce()
      expect(extractFilesWithNative).toHaveBeenCalledWith(
        files,
        expect.objectContaining({
          idInterpolationPattern:
            options.overrideIdFn ||
            options.idInterpolationPattern ||
            '[sha1:contenthash:base64:6]',
        })
      )
      expect(readFile).not.toHaveBeenCalled()

      const nodeResult = await extract(files, {
        ...options,
        signal: new AbortController().signal,
      })
      expect(nativeResult).toBe(nodeResult)
      expect(readFile).toHaveBeenCalledTimes(files.length)
      expect(extractFilesWithNative).toHaveBeenCalledOnce()
    }
  )

  it('keeps caller order and duplicate description checks', async () => {
    await writeFile(
      files[0],
      "defineMessage({id: 'same', defaultMessage: 'Same', description: 'First'})"
    )
    await writeFile(
      files[1],
      "defineMessage({id: 'same', defaultMessage: 'Same', description: 'Last'})"
    )
    vi.spyOn(process.stderr, 'write').mockReturnValue(true)
    expect(JSON.parse(await extract(files, {}))).toEqual({
      same: {defaultMessage: 'Same', description: 'Last'},
    })
    expect(JSON.parse(await extract([...files].reverse(), {}))).toEqual({
      same: {defaultMessage: 'Same', description: 'First'},
    })
    await expect(extract(files, {throws: true})).rejects.toThrow(
      'Duplicate message id'
    )
    expect(readFile).not.toHaveBeenCalled()
  })

  it('retains valid messages when another message or file cannot be parsed', async () => {
    await writeFile(
      files[0],
      "defineMessage({defaultMessage: dynamic}); defineMessage({id: 'valid', defaultMessage: 'Valid'})"
    )
    await writeFile(files[1], 'const broken =')
    vi.spyOn(process.stderr, 'write').mockReturnValue(true)
    expect(JSON.parse(await extract(files, {}))).toEqual({
      valid: {defaultMessage: 'Valid'},
    })
    await expect(extract(files, {throws: true})).rejects.toThrow()
    expect(readFile).not.toHaveBeenCalled()
  })

  it.each([false, true])(
    'fails missing input without writing output (existing=%s)',
    async existing => {
      const outFile = join(tempDir, 'messages.json')
      const previous = '{"previous":"Keep this catalog"}\n'
      if (existing) await writeFile(outFile, previous)
      const missing = join(tempDir, 'missing.ts')
      await expect(
        extractAndWrite([...files, missing], {outFile})
      ).rejects.toThrow('Failed to read file')
      expect(extractFilesWithNative).toHaveBeenCalledOnce()
      expect(readFile).not.toHaveBeenCalled()
      if (existing)
        expect(await actualFs.readFile(outFile, 'utf8')).toBe(previous)
      else
        await expect(actualFs.stat(outFile)).rejects.toMatchObject({
          code: 'ENOENT',
        })
    }
  )

  it('matches Node UTF-8 replacement decoding', async () => {
    await writeFile(
      files[0],
      Buffer.concat([
        Buffer.from("defineMessage({id: 'invalid.utf8', defaultMessage: '"),
        Buffer.from([0xff]),
        Buffer.from("'})"),
      ])
    )
    const nativeResult = await extract([files[0]], {})
    expect(readFile).not.toHaveBeenCalled()
    expect(nativeResult).toBe(
      await extract([files[0]], {signal: new AbortController().signal})
    )
  })

  it.each<ExtractOpts>([
    {extractSourceLocation: true},
    {signal: new AbortController().signal},
    {onMsgExtracted: () => {}},
    {onMetaExtracted: () => {}},
    {onMsgError: () => {}},
    {overrideIdFn: id => id || 'override'},
  ])('keeps the Node path for %j', async options => {
    await extract(files, options)
    expect(extractFilesWithNative).not.toHaveBeenCalled()
    expect(readFile).toHaveBeenCalledTimes(files.length)
  })

  it('keeps framework files on the Node path', async () => {
    const vueFile = join(tempDir, 'component.vue')
    await writeFile(
      vueFile,
      "<script>defineMessage({id: 'vue', defaultMessage: 'Vue'})</script>"
    )
    const result = JSON.parse(await extract([...files, vueFile], {}))
    expect(result.vue).toEqual({defaultMessage: 'Vue'})
    expect(extractFilesWithNative).not.toHaveBeenCalled()
    expect(readFile).toHaveBeenCalledTimes(files.length + 1)
  })

  it('reads Rust files natively with the same generated IDs', async () => {
    const rustFile = join(tempDir, 'main.rs')
    await writeFile(
      rustFile,
      'fn main() { let message = message_descriptor!(default_message: "Hello, {name}!", description: "Greeting"); }'
    )
    const nativeResult = await extract([rustFile], {})
    expect(readFile).not.toHaveBeenCalled()
    expect(Object.values(JSON.parse(nativeResult))).toEqual([
      {defaultMessage: 'Hello, {name}!', description: 'Greeting'},
    ])
    expect(nativeResult).toBe(
      await extract([rustFile], {signal: new AbortController().signal})
    )
  })

  it('keeps stdin on the Node path', async () => {
    expect(JSON.parse(await extract([], {readFromStdin: true}))).toEqual({
      stdin: {defaultMessage: 'Stdin'},
    })
    expect(getStdinAsString).toHaveBeenCalledOnce()
    expect(extractFilesWithNative).not.toHaveBeenCalled()
    expect(readFile).not.toHaveBeenCalled()
  })

  it('keeps unknown extensions on the Node path', async () => {
    const file = join(tempDir, 'input.custom')
    await writeFile(
      file,
      "defineMessage({id: 'custom', defaultMessage: 'Custom'})"
    )
    expect(JSON.parse(await extract([file], {}))).toEqual({
      custom: {defaultMessage: 'Custom'},
    })
    expect(extractFilesWithNative).not.toHaveBeenCalled()
    expect(readFile).toHaveBeenCalledOnce()
  })

  it('keeps empty input empty', async () => {
    expect(JSON.parse(await extract([], {}))).toEqual({})
    expect(extractFilesWithNative).not.toHaveBeenCalled()
    expect(readFile).not.toHaveBeenCalled()
  })
})
