import {join} from 'path'
import {compile, FIXTURES_DIR} from './utils'
import {basename} from 'path'

test('GH issue #3371', async function () {
  const output = await compile(join(FIXTURES_DIR, `resourcePath.tsx`), {
    ast: true,
    overrideIdFn: (id, defaultMessage, description, filePath) => {
      return `HELLO.${id}.${
        defaultMessage!.length
      }.${typeof description}.${basename(filePath || '')}`
    },
  })
  expect(output.msgs).toMatchInlineSnapshot(`
    [
      {
        "defaultMessage": "props {intl}",
        "description": "bar",
        "id": "HELLO..12.string.resourcePath.tsx",
      },
      {
        "defaultMessage": "this props {intl}",
        "description": "bar",
        "id": "HELLO..17.string.resourcePath.tsx",
      },
      {
        "defaultMessage": "foo {bar}",
        "description": "bar",
        "id": "HELLO..9.string.resourcePath.tsx",
      },
    ]
  `)
  expect(output.code).toMatchSnapshot()
})
