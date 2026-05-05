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
})
