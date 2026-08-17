import {mkdtemp, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {afterEach, describe, expect, it} from 'vitest'
import {extract} from '#packages/cli-lib/extract.js'

describe('extract', () => {
  let tempDir: string | undefined

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, {recursive: true, force: true})
      tempDir = undefined
    }
  })

  it('extracts messages wrapped in TypeScript assertions', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-cli-lib-'))
    const filePath = join(tempDir, 'typeAssertions.tsx')
    await writeFile(
      filePath,
      `
type DefaultMessage = string
type MessageDescriptor = {id: string; defaultMessage: string}

intl.formatMessage({
  id: 'format.satisfies',
  defaultMessage: \`Format satisfies\` satisfies DefaultMessage,
})

intl.formatMessage({
  id: 'format.as',
  defaultMessage: 'Format as' as DefaultMessage,
})

defineMessage({
  id: 'define.object.satisfies',
  defaultMessage: 'Define object satisfies',
} satisfies MessageDescriptor)
`
    )

    const result = JSON.parse(await extract([filePath], {throws: true}))

    expect(result).toEqual({
      'define.object.satisfies': {
        defaultMessage: 'Define object satisfies',
      },
      'format.as': {
        defaultMessage: 'Format as',
      },
      'format.satisfies': {
        defaultMessage: 'Format satisfies',
      },
    })
  })

  it('uses native extraction without an explicit id pattern', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-cli-lib-'))
    const filePath = join(tempDir, 'native.ts')

    await writeFile(filePath, `defineMessage({defaultMessage: 'Native'})`)

    const result = JSON.parse(await extract([filePath], {throws: true}))

    expect(Object.keys(result)).toHaveLength(1)
    expect(Object.values(result)).toEqual([{defaultMessage: 'Native'}])
  })

  it('keeps custom IDs, callbacks, metadata, and locations', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-cli-lib-'))
    const filePath = join(tempDir, 'callbacks.ts')
    const extracted: unknown[] = []
    const metadata: unknown[] = []

    await writeFile(
      filePath,
      `// @intl-meta project:test
defineMessage({defaultMessage: 'Callbacks'})`
    )

    const result = JSON.parse(
      await extract([filePath], {
        extractSourceLocation: true,
        onMetaExtracted: (_, meta) => metadata.push(meta),
        onMsgExtracted: (_, messages) => extracted.push(...messages),
        overrideIdFn: (_id, defaultMessage) => `custom-${defaultMessage}`,
        pragma: '@intl-meta',
        throws: true,
      })
    )

    expect(result['custom-Callbacks']).toMatchObject({
      defaultMessage: 'Callbacks',
      file: filePath,
      start: expect.any(Number),
      end: expect.any(Number),
    })
    expect(extracted).toHaveLength(1)
    expect(metadata).toEqual([{project: 'test'}])
  })

  it('reports native extraction errors without dropping partial output', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-cli-lib-'))
    const filePath = join(tempDir, 'errors.ts')
    const errors: Error[] = []

    await writeFile(
      filePath,
      `defineMessage({defaultMessage: dynamic})
defineMessage({id: 'valid', defaultMessage: 'Valid'})`
    )

    const result = JSON.parse(
      await extract([filePath], {
        onMsgError: (_filename, error) => errors.push(error),
        throws: false,
      })
    )

    expect(result).toEqual({valid: {defaultMessage: 'Valid'}})
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('defaultMessage')
  })
})
