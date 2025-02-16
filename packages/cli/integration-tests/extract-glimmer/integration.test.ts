import {exec as nodeExec} from 'child_process'
import {join} from 'path'
import {promisify} from 'util'
import {expect, test} from 'vitest'
const exec = promisify(nodeExec)

const BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')

test('gjs', async () => {
  const {stdout} = await exec(
    `${BIN_PATH} extract '${join(__dirname, '*.gjs')}'`
  )

  expect(JSON.parse(stdout)).toEqual({
    '7MCO2v': {
      defaultMessage: 'in template',
      description: 'in template desc',
    },
    FmytR9: {
      defaultMessage: "G'day!, from a secondary component in the same GJS file",
    },
    'getter-message': {
      defaultMessage: 'js getter with an id',
    },
    'hdXT/o': {
      defaultMessage: 'js getter with no id',
    },
    lMXYqa: {
      defaultMessage:
        '{connectorName, select, none {Install Service} other {Install {connectorName}} }',
    },
    mkhWoT: {
      defaultMessage:
        "Very long message with multiple'' breaklines and multiple spaces '<a href={href}>' Link '</a>'",
      description: 'Nice description',
    },
  })
}, 20000)

test('gts', async () => {
  const {stdout} = await exec(
    `${BIN_PATH} extract '${join(__dirname, '*.gts')}'`
  )

  expect(JSON.parse(stdout)).toEqual({
    '7MCO2v': {
      defaultMessage: 'in template',
      description: 'in template desc',
    },
    'getter-message': {
      defaultMessage: 'js getter with an id',
    },
    'hdXT/o': {
      defaultMessage: 'js getter with no id',
    },
    lMXYqa: {
      defaultMessage:
        '{connectorName, select, none {Install Service} other {Install {connectorName}} }',
    },
    mkhWoT: {
      defaultMessage:
        "Very long message with multiple'' breaklines and multiple spaces '<a href={href}>' Link '</a>'",
      description: 'Nice description',
    },
    o1wtct: {
      defaultMessage: 'hello from a secondary component in the same file',
    },
  })
}, 20000)

test('hbs', async () => {
  const {stdout} = await exec(
    `${BIN_PATH} extract '${join(__dirname, '*.hbs')}'`
  )

  expect(JSON.parse(stdout)).toEqual({
    '7MCO2v': {
      defaultMessage: 'in template',
      description: 'in template desc',
    },
    lMXYqa: {
      defaultMessage:
        '{connectorName, select, none {Install Service} other {Install {connectorName}} }',
    },
    mkhWoT: {
      defaultMessage:
        "Very long message with multiple'' breaklines and multiple spaces '<a href={href}>' Link '</a>'",
      description: 'Nice description',
    },
  })
}, 20000)
