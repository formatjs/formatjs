import {test, expect} from 'vitest'
import {
  extractSourcesWithNative,
  generateIdWithNative,
  type NativeMessageDescriptor,
} from '#packages/cli-lib/native'
import {parseFile} from '#packages/cli-lib/svelte_extractor'
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
      {
        additionalComponentNames: opts.additionalComponentNames,
        additionalFunctionNames: opts.additionalFunctionNames,
        throws: true,
      },
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

test('svelte_extractor', async function () {
  let messages: MessageDescriptor[] = []
  const fixturePath = join(import.meta.dirname, './fixtures/comp.svelte')
  parseFile(
    readFileSync(fixturePath, 'utf8'),
    fixturePath,
    parseScript({
      onMsgExtracted(_, msgs) {
        messages = messages.concat(msgs)
      },
      overrideIdFn: '[contenthash:5]',
    })
  )
  expect(messages).toMatchSnapshot()
})

test('svelte_extractor for bind attr', async function () {
  let messages: MessageDescriptor[] = []
  const fixturePath = join(import.meta.dirname, './fixtures/bind.svelte')
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

test('svelte_extractor for FormattedMessage components', async function () {
  let messages: MessageDescriptor[] = []
  parseFile(
    `
<script lang="ts">
  import FormattedMessage from './FormattedMessage.svelte'
  import CustomMessage from './CustomMessage.svelte'
</script>

<div class="Example">
  <FormattedMessage
    id="abc"
    defaultMessage="Abcdefghi"
    description="The beginning of the alphabet"
  />
  <CustomMessage
    defaultMessage="Custom Svelte message"
    description={{source: 'custom'}}
  />
  <IgnoredMessage
    defaultMessage="Ignored Svelte message"
    description="This should not be extracted"
  />
</div>
`,
    'formatted-message.svelte',
    parseScript({
      additionalComponentNames: ['CustomMessage'],
      onMsgExtracted(_, msgs) {
        messages = messages.concat(msgs)
      },
      overrideIdFn(id, defaultMessage) {
        return id || `generated:${defaultMessage}`
      },
    })
  )
  expect(messages).toEqual([
    {
      id: 'abc',
      defaultMessage: 'Abcdefghi',
      description: 'The beginning of the alphabet',
    },
    {
      id: 'generated:Custom Svelte message',
      defaultMessage: 'Custom Svelte message',
      description: {source: 'custom'},
    },
  ])
})
