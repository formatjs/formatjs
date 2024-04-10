import {MessageDescriptor, interpolateName} from '@formatjs/ts-transformer'
import {readFile} from 'fs-extra'
import {join} from 'path'

test('hbs_extractor', async function () {
  const {parseFile} = await import('../../src/hbs_extractor.mjs')
  let messages: MessageDescriptor[] = []
  const fixturePath = join(__dirname, './fixtures/comp.hbs')
  parseFile(await readFile(fixturePath, 'utf8'), fixturePath, {
    onMsgExtracted(_: any, msgs: any) {
      messages = messages.concat(msgs)
    },
    overrideIdFn: (
      id: any,
      defaultMessage: any,
      description: any,
      fileName: any
    ) =>
      id ||
      interpolateName(
        {
          resourcePath: fileName,
        } as any,
        '[sha512:contenthash:base64:6]',
        {
          content: description
            ? `${defaultMessage}#${description}`
            : defaultMessage,
        }
      ),
  })
  expect(messages).toMatchInlineSnapshot(`
    [
      {
        "defaultMessage": "in template",
        "description": "in template desc",
        "id": "7MCO2v",
      },
      {
        "defaultMessage": "{connectorName, select, none {Install Service} other {Install {connectorName}} }",
        "description": undefined,
        "id": "lMXYqa",
      },
      {
        "defaultMessage": "{connectorName, select, none {Install Service} other {Install {connectorName}} }",
        "description": undefined,
        "id": "lMXYqa",
      },
      {
        "defaultMessage": "Very long message with multiple'' breaklines and multiple spaces '<a href={href}>' Link '</a>'",
        "description": "Nice description",
        "id": "mkhWoT",
      },
      {
        "defaultMessage": "Very long message with multiple'' breaklines and multiple spaces '<a href={href}>' Link '</a>'",
        "description": "Nice description",
        "id": "mkhWoT",
      },
    ]
  `)
})
