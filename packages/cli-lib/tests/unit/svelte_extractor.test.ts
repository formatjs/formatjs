import {test, expect} from 'vitest'
import {type MessageDescriptor} from '@formatjs/ts-transformer'
import {parseScript} from '#packages/cli-lib/parse_script'
import {parseFile} from '#packages/cli-lib/svelte_extractor'
import {join} from 'path'
import {readFileSync} from 'fs'

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
