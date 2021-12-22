import {join} from 'path'
import {compile, FIXTURES_DIR} from './utils'

test('ast', async function () {
  const output = await compile(join(FIXTURES_DIR, `resourcePath.tsx`), {
    ast: true,
    overrideIdFn: (id, defaultMessage, description) => {
      return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
    },
  })
  expect(output.msgs).toMatchInlineSnapshot(`
    Array [
      Object {
        "defaultMessage": "props {intl}",
        "description": "bar",
        "id": "HELLO..12.string",
      },
      Object {
        "defaultMessage": "this props {intl}",
        "description": "bar",
        "id": "HELLO..17.string",
      },
      Object {
        "defaultMessage": "foo {bar}",
        "description": "bar",
        "id": "HELLO..9.string",
      },
    ]
  `)
  expect(output.code).toMatchSnapshot()
})
