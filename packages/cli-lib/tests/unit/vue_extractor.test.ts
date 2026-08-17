import {test, expect} from 'vitest'
import {
  extractSourcesWithNative,
  generateIdWithNative,
  type NativeMessageDescriptor,
} from '#packages/cli-lib/native'
import {parseFile} from '#packages/cli-lib/vue_extractor'
import {
  type ExtractTransformOptions,
  type MessageDescriptor,
} from '#packages/cli-lib/types'
import {join} from 'path'
import {readFileSync} from 'fs'

function parseScript(opts: ExtractTransformOptions) {
  return (source: string) => {
    const result = extractSourcesWithNative(
      [{filename: 'fixture.tsx', source}],
      {additionalFunctionNames: opts.additionalFunctionNames, throws: true},
      !opts.overrideIdFn
    )
    const messages = result.files[0].messages.map(
      (message: NativeMessageDescriptor): MessageDescriptor => ({
        ...message,
        id:
          typeof opts.overrideIdFn === 'function'
            ? opts.overrideIdFn(
                message.id,
                message.defaultMessage,
                message.description,
                'fixture.tsx'
              )
            : message.id ||
              generateIdWithNative(
                opts.overrideIdFn || '[sha1:contenthash:base64:6]',
                message.defaultMessage,
                message.description,
                'fixture.tsx'
              ),
      })
    )
    opts.onMsgExtracted?.('fixture.tsx', messages)
  }
}

test('vue_extractor', async function () {
  let messages: MessageDescriptor[] = []
  const fixturePath = join(import.meta.dirname, './fixtures/comp.vue')
  parseFile(
    readFileSync(fixturePath, 'utf8'),
    fixturePath,
    parseScript({
      additionalFunctionNames: ['$formatMessage'],
      onMsgExtracted(_, msgs) {
        messages = messages.concat(msgs)
      },
      overrideIdFn: '[contenthash:5]',
    })
  )
  expect(messages).toMatchSnapshot()
})

test('vue_extractor for bind attr', async function () {
  let messages: MessageDescriptor[] = []
  const fixturePath = join(import.meta.dirname, './fixtures/bind.vue')
  parseFile(
    readFileSync(fixturePath, 'utf8'),
    fixturePath,
    parseScript({
      additionalFunctionNames: ['$formatMessage'],
      onMsgExtracted(_, msgs) {
        messages = messages.concat(msgs)
      },
      overrideIdFn: '[contenthash:5]',
    })
  )
  expect(messages).toMatchSnapshot()
})
