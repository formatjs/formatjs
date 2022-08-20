import {transformSync} from '@swc/core'
import FormatJSTransformer from '..'

test('GH issue #3690', function () {
  const out = transformSync(
    `
  import { FormattedMessage } from "react-intl";

  export const Foo = () => (
    <div>
      <FormattedMessage defaultMessage="issue-3690" description="bar" />
    </div>
  );`,
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
