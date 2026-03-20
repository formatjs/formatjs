import {exec as nodeExec} from 'child_process'
import {mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync} from 'fs'
import {tmpdir} from 'os'
import {join, resolve} from 'path'
import {promisify} from 'util'
import {describe, expect, test} from 'vitest'
import {resolveRustBinaryPath} from '../rust-binary-utils'

const exec = promisify(nodeExec)

const TS_BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')
const RUST_BIN_PATH = resolveRustBinaryPath(import.meta.dirname)

const ARTIFACT_PATH = resolve(import.meta.dirname, 'test_artifacts')

describe.each([
  {name: 'TypeScript', binPath: TS_BIN_PATH, isRust: false},
  {name: 'Rust', binPath: RUST_BIN_PATH, isRust: true},
])('$name CLI', ({binPath, isRust}) => {
  test('basic case: help', async () => {
    await expect(exec(`${binPath} compile --help`)).resolves.toMatchSnapshot()
  }, 20000)

  test('basic case: empty json', async () => {
    await expect(
      exec(`${binPath} compile ${join(import.meta.dirname, 'lang/empty.json')}`)
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('normal json', async () => {
    await expect(
      exec(`${binPath} compile ${join(import.meta.dirname, 'lang/en.json')}`)
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('xx-LS json', async () => {
    await expect(
      exec(
        `${binPath} compile --ast --pseudo-locale xx-LS ${join(
          import.meta.dirname,
          'lang/en.json'
        )}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('xx-HA json', async () => {
    await expect(
      exec(
        `${binPath} compile --ast --pseudo-locale xx-HA ${join(
          import.meta.dirname,
          'lang/en.json'
        )}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('xx-AC json', async () => {
    await expect(
      exec(
        `${binPath} compile --ast --pseudo-locale xx-AC ${join(
          import.meta.dirname,
          'lang/en.json'
        )}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('en-XA json', async () => {
    await expect(
      exec(
        `${binPath} compile --ast --pseudo-locale en-XA ${join(
          import.meta.dirname,
          'lang/en.json'
        )}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('en-XB json', async () => {
    await expect(
      exec(
        `${binPath} compile --ast --pseudo-locale en-XB ${join(
          import.meta.dirname,
          'lang/en.json'
        )}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test.skipIf(isRust)(
    'normal json with formatter',
    async () => {
      await expect(
        exec(
          `${binPath} compile ${join(
            import.meta.dirname,
            'lang/en-format.json'
          )} --format ${join(import.meta.dirname, '../formatter.js')}`
        )
      ).resolves.toMatchSnapshot()
    },
    20000
  )

  test('normal json with transifex', async () => {
    await expect(
      exec(
        `${binPath} compile ${join(
          import.meta.dirname,
          'lang/en-transifex.json'
        )} --format transifex`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('normal json with smartling', async () => {
    await expect(
      exec(
        `${binPath} compile ${join(
          import.meta.dirname,
          'lang/en-smartling.json'
        )} --format smartling`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('normal json with simple', async () => {
    await expect(
      exec(
        `${binPath} compile ${join(
          import.meta.dirname,
          'lang/en-simple.json'
        )} --format simple`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('normal json with lokalise', async () => {
    await expect(
      exec(
        `${binPath} compile ${join(
          import.meta.dirname,
          'lang/en-lokalise.json'
        )} --format lokalise`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('normal json with crowdin', async () => {
    await expect(
      exec(
        `${binPath} compile ${join(
          import.meta.dirname,
          'lang/en-crowdin.json'
        )} --format crowdin`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('malformed ICU message json', async () => {
    await expect(
      exec(
        `${binPath} compile ${join(import.meta.dirname, 'lang/malformed-messages.json')}`
      )
    ).rejects.toThrowError('SyntaxError: EXPECT_ARGUMENT_CLOSING_BRACE')
  }, 20000)

  test('skipped malformed ICU message json', async () => {
    const result = await exec(
      `${binPath} compile  --skip-errors ${join(
        import.meta.dirname,
        'lang/malformed-messages.json'
      )}`
    )
    expect(result.stdout).toMatchSnapshot()
    expect(result.stderr).toMatch(
      /^\[@formatjs\/cli\] \[WARN\] Error validating message "my name is {name" with ID "a1dd2" in file .*\/packages\/cli\/integration-tests\/compile\/lang\/malformed-messages\.json/
    )
  }, 20000)

  test('AST', async () => {
    await expect(
      exec(
        `${binPath} compile --ast ${join(import.meta.dirname, 'lang/en.json')}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('out-file', async () => {
    const outFilePath = join(ARTIFACT_PATH, 'en.json')
    await expect(
      exec(
        `${binPath} compile ${join(
          import.meta.dirname,
          'lang/en.json'
        )} --out-file ${outFilePath}`
      )
    ).resolves.toMatchSnapshot()
    expect(require(outFilePath)).toMatchSnapshot()
  }, 20000)

  test('out-file --ast', async () => {
    const outFilePath = join(ARTIFACT_PATH, 'ast.json')
    await expect(
      exec(
        `${binPath} compile --ast ${join(
          import.meta.dirname,
          'lang/en.json'
        )} --out-file ${outFilePath}`
      )
    ).resolves.toMatchSnapshot()
    expect(require(outFilePath)).toMatchSnapshot()
  }, 20000)

  test('out-file --ignore-tag', async () => {
    const outFilePath = join(ARTIFACT_PATH, 'ignore-tag.json')
    await expect(
      exec(
        `${binPath} compile --ignore-tag ${join(
          import.meta.dirname,
          'lang/html-messages.json'
        )} --out-file ${outFilePath}`
      )
    ).resolves.toMatchSnapshot()
    expect(require(outFilePath)).toMatchSnapshot()
  }, 20000)

  test('compile glob', async () => {
    await expect(
      exec(`${binPath} compile "${join(import.meta.dirname, 'glob/*.json')}"`)
    ).resolves.toMatchSnapshot()
  })

  test('compile glob with conflict', async () => {
    await expect(
      exec(
        `${binPath} compile "${join(import.meta.dirname, 'glob-conflict/*.json')}"`
      )
    ).rejects.toThrowError(
      'Conflicting ID "a1d12" with different translation found in these 2 files'
    )
  })

  test('compile glob with pnpm-style symlinked node_modules', async () => {
    // Reproduces pnpm's node_modules layout where packages are stored
    // in .pnpm and symlinked into node_modules. This is the exact
    // scenario from issue #6173 that fails without --follow-links.
    const tmp = mkdtempSync(join(tmpdir(), 'formatjs-pnpm-'))
    try {
      // Real package lives in .pnpm store
      const realPkgDir = join(
        tmp,
        'node_modules',
        '.pnpm',
        'some-pkg@1.0.0',
        'node_modules',
        'some-pkg',
        'dist',
        'lang'
      )
      mkdirSync(realPkgDir, {recursive: true})
      writeFileSync(
        join(realPkgDir, 'en.json'),
        JSON.stringify({
          hello: {
            defaultMessage: 'Hello from symlinked package!',
            description: 'Symlink test',
          },
        })
      )
      // Symlink node_modules/some-pkg -> .pnpm/some-pkg@1.0.0/node_modules/some-pkg
      symlinkSync(
        join(
          tmp,
          'node_modules',
          '.pnpm',
          'some-pkg@1.0.0',
          'node_modules',
          'some-pkg'
        ),
        join(tmp, 'node_modules', 'some-pkg')
      )
      const result = await exec(
        `${binPath} compile "${join(tmp, 'node_modules/some-pkg/**/lang/en.json')}"`
      )
      expect(JSON.parse(result.stdout)).toEqual({
        hello: 'Hello from symlinked package!',
      })
    } finally {
      rmSync(tmp, {recursive: true, force: true})
    }
  }, 20000)

  test('compile glob with node_modules structure', async () => {
    // Create a temp dir with node_modules structure on the fly
    // to avoid Bazel glob() excluding node_modules directories.
    // This reproduces the exact scenario from issue #6173.
    const tmp = mkdtempSync(join(tmpdir(), 'formatjs-test-'))
    try {
      const langDir = join(tmp, 'node_modules', 'some-pkg', 'dist', 'lang')
      mkdirSync(langDir, {recursive: true})
      writeFileSync(
        join(langDir, 'en.json'),
        JSON.stringify({
          greeting: {
            defaultMessage: 'Hello from package!',
            description: 'Greeting from a nested package',
          },
          farewell: {
            defaultMessage: 'Goodbye from package!',
            description: 'Farewell from a nested package',
          },
        })
      )
      const result = await exec(
        `${binPath} compile "${join(tmp, 'node_modules/**/dist/lang/en.json')}"`
      )
      expect(JSON.parse(result.stdout)).toEqual({
        farewell: 'Goodbye from package!',
        greeting: 'Hello from package!',
      })
    } finally {
      rmSync(tmp, {recursive: true, force: true})
    }
  }, 20000)
})
