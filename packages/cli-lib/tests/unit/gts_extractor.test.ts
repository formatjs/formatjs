import { MessageDescriptor, interpolateName } from '@formatjs/ts-transformer'
import { readFile } from 'fs-extra'
import { join } from 'path'

describe('gts_extractor', () => {
  test('gts files', async function() {
    const { parseFile } = await import('../../src/gts_extractor.mjs');

    let messages: MessageDescriptor[] = []
    const fixturePath = join(__dirname, './fixtures/comp.gts')
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

  test('gjs files', async function() {
    const { parseFile } = await import('../../src/gts_extractor.mjs');

    let messages: MessageDescriptor[] = []
    const fixturePath = join(__dirname, './fixtures/comp.gjs')
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

})
