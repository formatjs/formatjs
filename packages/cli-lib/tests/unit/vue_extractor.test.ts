import {MessageDescriptor} from '@formatjs/ts-transformer'
import {parseScript} from '../../src/parse_script'
import {parseFile} from '../../src/vue_extractor'
import {readFile} from 'fs-extra'
import {join} from 'path'

test('vue_extractor', async function () {
  let messages: MessageDescriptor[] = []
  const fixturePath = join(__dirname, './fixtures/comp.vue')
  parseFile(
    await readFile(fixturePath, 'utf8'),
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
  const fixturePath = join(__dirname, './fixtures/bind.vue')
  parseFile(
    await readFile(fixturePath, 'utf8'),
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
