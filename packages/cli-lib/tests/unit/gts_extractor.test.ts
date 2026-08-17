import {describe, test, expect} from 'vitest'
import {join} from 'path'
import {extract} from '#packages/cli-lib/extract'

async function extractMessages(fixturePath: string) {
  const result = JSON.parse(
    await extract([fixturePath], {
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      throws: true,
    })
  )
  return Object.entries(result).map(([id, message]) => ({
    id,
    ...(message as object),
  }))
}

describe('gts_extractor', () => {
  test('gts files', async function () {
    const fixturePath = join(import.meta.dirname, './fixtures/comp.gts')
    const messages = await extractMessages(fixturePath)
    expect(messages).toMatchSnapshot()
  })

  test('gjs files', async function () {
    const fixturePath = join(import.meta.dirname, './fixtures/comp.gjs')
    const messages = await extractMessages(fixturePath)
    expect(messages).toMatchSnapshot()
  })
})
