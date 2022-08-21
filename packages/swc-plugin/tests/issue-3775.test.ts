import {transform} from '@swc/core'
import FormatJSTransformer from '..'

const input = `
const msgs = defineMessages({
  message: {
    defaultMessage: \`Hello World!\`,
    description: 'The default message',
  },
});
`

test('GH issue #3775', async function () {
  const out = await transform(input, {
    filename: 'test.ts',
    jsc: {
      parser: {
        syntax: 'typescript',
        decorators: true,
        dynamicImport: true,
      },
    },
    plugin: m =>
      new FormatJSTransformer({
        filename: 'test.js',
        overrideIdFn: '[hash:base64:10]',
      }).visitProgram(m),
  })
  expect(out).toMatchSnapshot()
})
