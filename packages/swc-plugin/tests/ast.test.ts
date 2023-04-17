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
    [
      {
        "defaultMessage": "props {intl}",
        "description": "bar",
        "id": "HELLO..12.string",
      },
      {
        "defaultMessage": "this props {intl}",
        "description": "bar",
        "id": "HELLO..17.string",
      },
      {
        "defaultMessage": "foo {bar}",
        "description": "bar",
        "id": "HELLO..9.string",
      },
    ]
  `)
  expect(output.code).toMatchSnapshot()
})
