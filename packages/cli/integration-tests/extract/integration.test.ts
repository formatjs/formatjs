import {resolve, join} from 'path'
import {promisify} from 'util'
import {exec as nodeExec} from 'child_process'
import {readJSON, mkdirp} from 'fs-extra'
import _rimraf from 'rimraf'
const exec = promisify(nodeExec)
const rimraf = promisify(_rimraf)

const BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')
const ARTIFACT_PATH = resolve(__dirname, 'test_artifacts')

beforeEach(async () => {
  await mkdirp(join(__dirname, 'test_artifacts'))
  await rimraf(ARTIFACT_PATH)
})

test('basic case: help', async () => {
  await expect(exec(`${BIN_PATH} extract --help`)).resolves.toMatchSnapshot()
}, 20000)

test('basic case: defineMessages -> stdout', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract --throws ${join(
        __dirname,
        'defineMessages/actual.js'
      )}`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('flatten defineMessages -> stdout', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract --flatten --throws ${join(
        __dirname,
        'defineMessages/actual.js'
      )}`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('bad json', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract --throws ${join(__dirname, 'defineMessages/*.js*')}`
    )
  ).rejects.toThrowError('Error processing file')
}, 20000)

test('[glob] basic case: defineMessages -> stdout', async () => {
  await expect(
    exec(`${BIN_PATH} extract ${join(__dirname, 'defineMessages/*.js')}`)
  ).resolves.toMatchSnapshot()
}, 20000)

test('basic case: defineMessages -> out-file', async () => {
  process.chdir(__dirname)
  await expect(
    exec(
      `${BIN_PATH} extract defineMessages/actual.js --out-file ${ARTIFACT_PATH}/defineMessages/actual.json`
    )
  ).resolves.toMatchSnapshot()

  expect(
    await readJSON(join(ARTIFACT_PATH, 'defineMessages/actual.json'))
  ).toMatchSnapshot()
}, 20000)

test('basic case: defineMessages -> out-file with location', async () => {
  process.chdir(__dirname)
  await expect(
    exec(
      `${BIN_PATH} extract defineMessages/actual.js --extract-source-location --out-file ${ARTIFACT_PATH}/defineMessages/actual.json`
    )
  ).resolves.toMatchSnapshot()

  expect(
    await readJSON(join(ARTIFACT_PATH, 'defineMessages/actual.json'))
  ).toMatchSnapshot()
}, 20000)

test('typescript -> stdout', async () => {
  await expect(
    exec(`${BIN_PATH} extract ${join(__dirname, 'typescript/actual.tsx')}`)
  ).resolves.toMatchSnapshot()
}, 20000)

test('pragma', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract --pragma intl ${join(
        __dirname,
        'typescript/pragma.tsx'
      )}`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('typescript -> stdout with formatter', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract ${join(
        __dirname,
        'typescript/actual.tsx'
      )} --format ${join(__dirname, '../formatter.js')}`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('typescript -> stdout with transifex', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract ${join(
        __dirname,
        'typescript/actual.tsx'
      )} --format transifex`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('typescript -> stdout with simple', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract ${join(
        __dirname,
        'typescript/actual.tsx'
      )} --format simple`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('typescript -> stdout with lokalise', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract ${join(
        __dirname,
        'typescript/actual.tsx'
      )} --format lokalise`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('typescript -> stdout with crowdin', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract ${join(
        __dirname,
        'typescript/actual.tsx'
      )} --format crowdin`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('typescript -> stdout with smartling', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract ${join(
        __dirname,
        'typescript/actual.tsx'
      )} --format smartling`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

const ignore = "--ignore '*.ignore.*'"

test('ignore -> stdout TS', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract --throws ${join(
        __dirname,
        'typescript/actual.tsx'
      )} ${ignore}`
    )
  ).resolves.toMatchSnapshot()
}, 20000)

test('ignore -> stdout JS', async () => {
  const jsResult = await exec(
    `${BIN_PATH} extract '${join(__dirname, 'defineMessages/*.js')}' ${ignore}`
  )
  expect(JSON.parse(jsResult.stdout)).toMatchSnapshot()
  expect(jsResult.stderr).toBe('')
}, 20000)

test('duplicated descriptor ids shows warning', async () => {
  const {stderr, stdout} = await exec(
    `${BIN_PATH} extract '${join(__dirname, 'duplicated/*.tsx')}'`
  )
  expect(JSON.parse(stdout)).toMatchSnapshot()
  expect(stderr).toContain('Duplicate message id: "foo"')
}, 20000)

test('duplicated descriptor ids throws', async () => {
  expect(async () => {
    await exec(
      `${BIN_PATH} extract --throws '${join(__dirname, 'duplicated/*.tsx')}'`
    )
  }).rejects.toThrowError('Duplicate message id: "foo"')
}, 20000)

test('non duplicated descriptors does not throw', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract --throws '${join(
        __dirname,
        'nonDuplicated/*.tsx'
      )}' --out-file ${ARTIFACT_PATH}/nonDuplicated/actual.json`
    )
  ).resolves.toMatchSnapshot()

  expect(
    await readJSON(join(ARTIFACT_PATH, 'nonDuplicated/actual.json'))
  ).toMatchSnapshot()
}, 20000)

test('invalid syntax should throw', async () => {
  expect(async () => {
    await exec(
      `${BIN_PATH} extract --throws '${join(__dirname, 'typescript/err.tsx')}'`
    )
  }).rejects.toThrowError('TS1005')
}, 20000)

test('whitespace and newlines should be preserved', async () => {
  process.chdir(__dirname)
  await expect(
    exec(
      `${BIN_PATH} extract '${join(
        __dirname,
        'typescript/actual.tsx'
      )}' --out-file ${ARTIFACT_PATH}/defineMessages/actual.json`
    )
  ).resolves.toMatchSnapshot()

  expect(
    await readJSON(join(ARTIFACT_PATH, 'defineMessages/actual.json'))
  ).toMatchSnapshot()
}, 20000)

// See: https://github.com/formatjs/formatjs/issues/3630
test('TypeScript 4.7 syntax', async () => {
  await expect(
    exec(
      `${BIN_PATH} extract --throws '${join(
        __dirname,
        'typescript/ts47.tsx'
      )}' --out-file ${ARTIFACT_PATH}/typescript/ts47.json`
    )
  ).resolves.toMatchSnapshot()

  expect(
    await readJSON(join(ARTIFACT_PATH, 'typescript/ts47.json'))
  ).toMatchSnapshot()
})
