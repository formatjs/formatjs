import {exec as nodeExec} from 'child_process'
import {sync as globSync} from 'fast-glob'
import {mkdtempSync} from 'fs'
import {readJSON} from 'fs-extra'
import {basename, join} from 'path'
import {promisify} from 'util'
const exec = promisify(nodeExec)
const BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')

test('basic case: help', async () => {
  await expect(
    exec(`${BIN_PATH} compile-folder --help`)
  ).resolves.toMatchSnapshot()
}, 20000)

test('basic case', async () => {
  const inputFiles = globSync(`${__dirname}/lang/*.json`)
  const outFolder = mkdtempSync('formatjs-cli')
  await exec(
    `${BIN_PATH} compile-folder ${join(__dirname, 'lang')} ${outFolder}`
  )

  const outputFiles = globSync(`${outFolder}/*.json`)
  expect(outputFiles.map(f => basename(f))).toEqual(
    inputFiles.map(f => basename(f))
  )

  await expect(
    Promise.all(outputFiles.map(f => readJSON(f)))
  ).resolves.toMatchSnapshot()
}, 20000)
