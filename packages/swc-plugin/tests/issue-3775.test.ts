import {transformSync} from '@swc/core'
import FormatJSTransformer from '..'

test('GH issue #3690', function () {
  const out = transformSync(
    `
    const msgs = defineMessages({
        header: {
          defaultMessage: \`Hello World!\`,
          description: 'The default message',
        },
      });
  `,
    {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        target: 'es2018',
      },
      plugin: m => {
        return new FormatJSTransformer({
          overrideIdFn: '[sha512:contenthash:base64:6]',
          ast: true,
          removeDefaultMessage: false,
        }).visitProgram(m)
      },
    }
  )
  expect(out).toMatchSnapshot()
})
