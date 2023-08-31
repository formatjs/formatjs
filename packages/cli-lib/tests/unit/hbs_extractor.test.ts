import {MessageDescriptor, interpolateName} from '@formatjs/ts-transformer'
import {parseFile} from '../../src/hbs_extractor'
import {readFile} from 'fs-extra'
import {join} from 'path'
test('hbs_extractor', async function () {
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
  expect(messages).toMatchSnapshot()
})
