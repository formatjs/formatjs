import {join} from 'path'
import {compile, FIXTURES_DIR} from './utils'

test('resourcePath', async function () {
  const output = await compile(join(FIXTURES_DIR, `resourcePath.tsx`), {
    overrideIdFn: '[name]-[hash:base64:5]',
  })
  expect(output.msgs).toMatchInlineSnapshot(`
    [
      {
        "defaultMessage": "props {intl}",
        "description": "bar",
        "id": "resourcePath-hYpBl",
      },
      {
        "defaultMessage": "this props {intl}",
        "description": "bar",
        "id": "resourcePath-tBZlS",
      },
      {
        "defaultMessage": "foo {bar}",
        "description": "bar",
        "id": "resourcePath-ALfyd",
      },
    ]
  `)
  expect(output.code).toMatchSnapshot()
})
