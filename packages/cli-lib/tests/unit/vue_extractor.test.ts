import {test, expect} from 'vitest'
import {type MessageDescriptor} from '@formatjs/ts-transformer'
import {parseScript} from '../../src/parse_script'
import {parseFile} from '../../src/vue_extractor'
import {join} from 'path'
import {readFileSync} from 'fs'

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
