import {spawn} from 'child_process'
import {Runfiles} from '@bazel/runfiles'
import {mkdtemp, readFile, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {afterEach, expect, test} from 'vitest'

const BIN_PATH = new Runfiles().resolveWorkspaceRelative(
  'packages/cli-lib/bin/formatjs'
)

function runCli(args: string[], cwd: string) {
  return new Promise<{code: number | null; stdout: string; stderr: string}>(
    resolve => {
      const child = spawn(BIN_PATH, args, {cwd})
      let stdout = ''
      let stderr = ''
      child.stdout.setEncoding('utf8').on('data', chunk => (stdout += chunk))
      child.stderr.setEncoding('utf8').on('data', chunk => (stderr += chunk))
      child.on('close', code => resolve({code, stdout, stderr}))
    }
  )
}

let tempDir: string | undefined

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, {recursive: true, force: true})
    tempDir = undefined
  }
})

test('help', async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'formatjs-sync-source-cli-'))
  const result = await runCli(['sync-source', '--help'], tempDir)

  expect(result.code).toBe(0)
  expect(result.stdout).toContain('--source-file <path>')
  expect(result.stdout).toContain('--write')
})

test('checks and writes source messages', async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'formatjs-sync-source-cli-'))
  const sourceFile = join(tempDir, 'messages.tsx')
  const catalogFile = join(tempDir, 'en.json')
  const original = `
defineMessage({id: 'greeting', defaultMessage: 'Hello {name}'})
const message = <FormattedMessage id="greeting" defaultMessage="Hello {name}" />
`
  await writeFile(sourceFile, original)
  await writeFile(catalogFile, JSON.stringify({greeting: 'Welcome, {name}!'}))

  const check = await runCli(
    ['sync-source', sourceFile, '--source-file', catalogFile],
    tempDir
  )
  expect(check.code).toBe(1)
  expect(check.stdout).toContain('Found 2 stale message occurrences in 1 file.')
  expect(await readFile(sourceFile, 'utf8')).toBe(original)

  const write = await runCli(
    ['sync-source', sourceFile, '--source-file', catalogFile, '--write'],
    tempDir
  )
  expect(write.code).toBe(0)
  expect(write.stdout).toContain('Updated 2 message occurrences in 1 file.')
  expect(await readFile(sourceFile, 'utf8')).toContain(
    `defaultMessage: 'Welcome, {name}!'`
  )
  expect(await readFile(sourceFile, 'utf8')).toContain(
    `defaultMessage={"Welcome, {name}!"}`
  )

  const clean = await runCli(
    ['sync-source', sourceFile, '--source-file', catalogFile],
    tempDir
  )
  expect(clean.code).toBe(0)
  expect(clean.stdout).toContain('Source messages are in sync.')
})
