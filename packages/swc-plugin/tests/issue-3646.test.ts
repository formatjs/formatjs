import {join} from 'path'
import {compile, FIXTURES_DIR} from './utils'

test.only('github issue #3646', async function () {
  const output = await compile(join(FIXTURES_DIR, `issue-3646.tsx`), {})
  expect(output.msgs).toMatchInlineSnapshot(`
    Array [
      Object {
        "defaultMessage": "Hello World!",
        "description": "The default message",
        "id": "GCdcoTfS3U",
      },
      Object {
        "defaultMessage": "Hello Nurse!",
        "description": "Another message",
        "id": "foo.bar.biff",
      },
    ]
  `)
  expect(output.code).toMatchSnapshot()
})
