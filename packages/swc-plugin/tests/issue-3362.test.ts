import {join} from 'path'
import {compile, FIXTURES_DIR} from './utils'

test.only('github issue #3362', async function () {
  const output = await compile(join(FIXTURES_DIR, `issue-3362.tsx`), {
    overrideIdFn: (id, defaultMessage, description) => {
      return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
    },
  })
  expect(output.msgs).toMatchInlineSnapshot(`
    Array [
      Object {
        "defaultMessage": "test",
        "id": "HELLO.Krqghu.4.undefined",
      },
      Object {
        "defaultMessage": "testsss",
        "id": "HELLO.Krqghus.7.undefined",
      },
    ]
  `)
  expect(output.code).toMatchSnapshot()
})
