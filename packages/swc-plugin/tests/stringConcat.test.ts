import {join} from 'path'
import {compile, FIXTURES_DIR} from './utils'

test('stringConcat', async function () {
  const output = await compile(join(FIXTURES_DIR, `stringConcat.tsx`), {})
  expect(output.msgs).toMatchInlineSnapshot(`
    Array [
      Object {
        "defaultMessage": "Hello World!farbaz",
        "description": "The default message.",
        "id": "foo.bar.bazid",
      },
      Object {
        "defaultMessage": "Hello World!foobar",
        "description": "The default message",
        "id": "header",
      },
      Object {
        "defaultMessage": "Hello World!",
        "description": "The default message asd",
        "id": "header2",
      },
    ]
  `)
  expect(output.code).toMatchSnapshot()
})
