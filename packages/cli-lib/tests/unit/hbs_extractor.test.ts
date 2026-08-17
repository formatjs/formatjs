import {test, expect} from 'vitest'
import {join} from 'path'
import {extract} from '#packages/cli-lib/extract'

test('hbs_extractor', async function () {
  const fixturePath = join(import.meta.dirname, './fixtures/comp.hbs')
  const result = JSON.parse(
    await extract([fixturePath], {
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      throws: true,
    })
  )
  const messages = Object.entries(result).map(([id, message]) => ({
    id,
    ...(message as object),
  }))
  expect(messages).toMatchSnapshot()
})
