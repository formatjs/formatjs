import {test, expect} from 'vitest'
import {type MessageDescriptor, interpolateName} from '@formatjs/ts-transformer'
import {readFile} from 'node:fs/promises'
import {join} from 'path'
import {parseFile} from '../../src/hbs_extractor'

test('hbs_extractor', async function () {
  let messages: MessageDescriptor[] = []
  const fixturePath = join(import.meta.dirname, './fixtures/comp.hbs')
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
  expect(messages).toMatchSnapshot()
})
