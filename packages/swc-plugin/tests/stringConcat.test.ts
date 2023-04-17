import {join} from 'path'
import {compile, FIXTURES_DIR} from './utils'

test('stringConcat', async function () {
  const output = await compile(join(FIXTURES_DIR, `stringConcat.tsx`), {})
  expect(output.msgs).toMatchInlineSnapshot(`
    [
      {
        "defaultMessage": "Hello World!farbaz",
        "description": "The default message.",
        "id": "foo.bar.bazid",
      },
      {
        "defaultMessage": "Hello World!foobar",
        "description": "The default message",
        "id": "header",
      },
      {
        "defaultMessage": "Hello World!",
        "description": "The default message asd",
        "id": "header2",
      },
    ]
  `)
  expect(output.code).toMatchSnapshot()
})
