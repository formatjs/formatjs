import {join} from 'path'
import {promisify} from 'util'
import {exec as nodeExec} from 'child_process'
import {expect, test} from 'vitest'
const exec = promisify(nodeExec)

const BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')

test('vue', async () => {
  const {stdout} = await exec(
    `${BIN_PATH} extract '${join(import.meta.dirname, '*.vue')}'`
  )

  expect(JSON.parse(stdout)).toEqual({
    '3mGZ30': {
      defaultMessage: 'in script',
      description: 'in script desc',
    },
    '7MCO2v': {
      defaultMessage: 'in template',
      description: 'in template desc',
    },
    S3wEt4: {
      defaultMessage: 'script setup',
    },
  })
}, 20000)
