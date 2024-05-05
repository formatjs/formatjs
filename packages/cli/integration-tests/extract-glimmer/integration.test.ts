import {exec as nodeExec} from 'child_process'
import {join} from 'path'
import {promisify} from 'util'
const exec = promisify(nodeExec)

const BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')

test('gjs', async () => {
  const {stdout} = await exec(
    `${BIN_PATH} extract '${join(__dirname, '*.gjs')}'`
  )

  expect(JSON.parse(stdout)).toMatchSnapshot()
}, 20000)

test('gts', async () => {
  const {stdout} = await exec(
    `${BIN_PATH} extract '${join(__dirname, '*.gts')}'`
  )

  expect(JSON.parse(stdout)).toMatchSnapshot()
}, 20000)

test('hbs', async () => {
  const {stdout} = await exec(
    `${BIN_PATH} extract '${join(__dirname, '*.hbs')}'`
  )

  expect(JSON.parse(stdout)).toMatchSnapshot()
}, 20000)
