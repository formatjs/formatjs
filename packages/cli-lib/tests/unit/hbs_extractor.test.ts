import {test, expect} from 'vitest'
import {type MessageDescriptor, interpolateName} from '@formatjs/ts-transformer'
import {readFile} from 'fs-extra/esm'
import {join} from 'path'
import {parseFile} from '../../src/hbs_extractor'

// TODO: Fix ES module compatibility issue with @glimmer/syntax and ember-template-recast
// This test is disabled because ember-template-recast uses require() to import @glimmer/syntax
// which is an ES module, causing "require() of ES Module not supported" errors in Vitest
test.skip('hbs_extractor', async function () {
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
