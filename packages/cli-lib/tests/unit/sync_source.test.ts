import {mkdtemp, readFile, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {afterEach, describe, expect, it} from 'vitest'
import {syncSource, syncSourceFromFile} from '#packages/cli-lib/sync_source.js'

describe('syncSource', () => {
  let tempDir: string | undefined

  async function fixture(name: string, source: string): Promise<string> {
    tempDir ||= await mkdtemp(join(tmpdir(), 'formatjs-sync-source-'))
    const file = join(tempDir, name)
    await writeFile(file, source)
    return file
  }

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, {recursive: true, force: true})
      tempDir = undefined
    }
  })

  it('checks every occurrence without writing by default', async () => {
    const source = `
const first = defineMessage({
  id: 'greeting',
  defaultMessage: 'Hello {name}',
})
const second = intl.formatMessage({
  id: "greeting",
  defaultMessage: \`Hello {name}\`,
})
const third = <FormattedMessage id="greeting" defaultMessage="Hello {name}" />
`
    const file = await fixture('messages.tsx', source)

    const result = await syncSource([file], {
      greeting: 'Welcome, {name}!',
    })

    expect(result.changedFiles).toEqual([file])
    expect(result.changes).toHaveLength(3)
    expect(result.changes.map(change => change.id)).toEqual([
      'greeting',
      'greeting',
      'greeting',
    ])
    expect(await readFile(file, 'utf8')).toBe(source)
  })

  it('writes minimal, syntax-aware source edits', async () => {
    const file = await fixture(
      'messages.tsx',
      `
defineMessage({id: 'single', defaultMessage: 'Old'})
defineMessage({id: "double", defaultMessage: "Old"})
defineMessage({id: 'template', defaultMessage: \`Old {value}\`})
const jsx = <FormattedMessage id="jsx" defaultMessage="Old" />
`
    )

    await syncSource(
      [file],
      {
        single: `Don't escape “Unicode”`,
        double: 'Say "hello"',
        template: 'Line one\rLine two\n`${value}` \\ line three',
        jsx: 'Use "quotes" & signs',
      },
      {write: true}
    )

    expect(await readFile(file, 'utf8')).toBe(`
defineMessage({id: 'single', defaultMessage: 'Don\\'t escape “Unicode”'})
defineMessage({id: "double", defaultMessage: "Say \\"hello\\""})
defineMessage({id: 'template', defaultMessage: \`Line one\\rLine two
\\\`\\\${value}\\\` \\\\ line three\`})
const jsx = <FormattedMessage id="jsx" defaultMessage={"Use \\"quotes\\" & signs"} />
`)
  })

  it('validates the full batch before writing', async () => {
    const firstSource = `defineMessage({id: 'first', defaultMessage: 'Old'})`
    const secondSource = `defineMessage({id: 'second', defaultMessage: 'Hello {name}'})`
    const first = await fixture('first.ts', firstSource)
    const second = await fixture('second.ts', secondSource)

    await expect(
      syncSource(
        [first, second],
        {first: 'New', second: 'Hello {count}'},
        {write: true}
      )
    ).rejects.toThrow('changes ICU structure')

    expect(await readFile(first, 'utf8')).toBe(firstSource)
    expect(await readFile(second, 'utf8')).toBe(secondSource)
  })

  it('rejects stale descriptors that cannot be safely rewritten', async () => {
    const file = await fixture(
      'messages.ts',
      `defineMessage({id: 'spread', defaultMessage: 'Old', ...override})`
    )

    await expect(syncSource([file], {spread: 'New'})).rejects.toThrow(
      'does not have a writable static ID'
    )
  })

  it('rejects descriptors that cannot be statically checked', async () => {
    const file = await fixture(
      'messages.ts',
      `defineMessage({id: 'dynamic', defaultMessage: getCopy()})`
    )

    await expect(syncSource([file], {dynamic: 'New'})).rejects.toThrow(
      '`defaultMessage` must be a string literal'
    )
  })

  it('updates the effective static property and rejects unknown shadows', async () => {
    const staticFile = await fixture(
      'static.ts',
      `defineMessage({id: 'shadowed', defaultMessage: 'Old', ['defaultMessage']: 'Actual'})`
    )

    await syncSource([staticFile], {shadowed: 'New'}, {write: true})
    expect(await readFile(staticFile, 'utf8')).toBe(
      `defineMessage({id: 'shadowed', defaultMessage: 'Old', ['defaultMessage']: 'New'})`
    )

    const dynamicFile = await fixture(
      'dynamic.ts',
      `defineMessage({id: 'shadowed', defaultMessage: 'Old', [key]: 'Actual'})`
    )
    await expect(syncSource([dynamicFile], {shadowed: 'New'})).rejects.toThrow(
      'does not have a writable static ID'
    )
  })

  it('loads simple and default catalogs without the native binding', async () => {
    const file = await fixture(
      'messages.ts',
      `defineMessage({id: 'greeting', defaultMessage: 'Old'})`
    )
    const simpleCatalog = await fixture(
      'simple.json',
      JSON.stringify({greeting: 'From simple'})
    )
    const defaultCatalog = await fixture(
      'default.json',
      JSON.stringify({greeting: {defaultMessage: 'From default'}})
    )

    await expect(
      syncSourceFromFile([file], {sourceFile: simpleCatalog})
    ).resolves.toMatchObject({changes: [{next: 'From simple'}]})
    await expect(
      syncSourceFromFile([file], {
        sourceFile: defaultCatalog,
        format: 'default',
      })
    ).resolves.toMatchObject({changes: [{next: 'From default'}]})
  })

  it('rejects invalid catalog values and ICU messages', async () => {
    const file = await fixture(
      'messages.ts',
      `defineMessage({id: 'greeting', defaultMessage: 'Hello'})`
    )

    await expect(
      syncSource([file], {greeting: 42} as unknown as Record<string, string>)
    ).rejects.toThrow('must be a string')
    await expect(syncSource([file], {greeting: 'Hello {'})).rejects.toThrow(
      'Invalid ICU message'
    )
  })
})
