import {test, expect, describe} from 'vitest'
import {extract} from '../../src/extract'
import {join} from 'path'

describe('extract with throws flag', () => {
  test('throws: false should return partial results when file has errors', async () => {
    const fixturePath = join(
      import.meta.dirname,
      './fixtures/partial-extraction.ts'
    )

    // With throws: false, we should get partial results instead of an error
    const result = await extract([fixturePath], {
      throws: false,
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
    })

    const parsed = JSON.parse(result)

    // We should have extracted the valid messages even though one had an error
    expect(Object.keys(parsed).length).toBeGreaterThan(0)

    // Check that we got at least some of the valid messages
    const messages = Object.values(parsed) as Array<{defaultMessage: string}>
    expect(messages.some(m => m.defaultMessage === 'This is a valid message')).toBe(true)
  })

  test('throws: true should throw error when file has errors', async () => {
    const fixturePath = join(
      import.meta.dirname,
      './fixtures/partial-extraction.ts'
    )

    // With throws: true (or undefined), we should get an error
    await expect(
      extract([fixturePath], {
        throws: true,
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
      })
    ).rejects.toThrow()
  })

  test('throws: false should collect messages from multiple files even when some have errors', async () => {
    const validFixture = join(import.meta.dirname, './fixtures/comp.vue')
    const invalidFixture = join(
      import.meta.dirname,
      './fixtures/partial-extraction.ts'
    )

    // With throws: false, we should get results from valid files
    const result = await extract([validFixture, invalidFixture], {
      throws: false,
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      additionalFunctionNames: ['$formatMessage'],
    })

    const parsed = JSON.parse(result)

    // We should have extracted messages from at least the valid file
    expect(Object.keys(parsed).length).toBeGreaterThan(0)
  })
})
