import {exec as nodeExec} from 'child_process'
import {mkdirp, readJSON, remove} from 'fs-extra/esm'
import {join, resolve} from 'path'
import {promisify} from 'util'
import {beforeEach, describe, expect, test} from 'vitest'
import {resolveRustBinaryPath} from '../rust-binary-utils'

const exec = promisify(nodeExec)

const TS_BIN_PATH = require.resolve('@formatjs/cli/bin/formatjs')
const RUST_BIN_PATH = resolveRustBinaryPath(import.meta.dirname)

const ARTIFACT_PATH = resolve(import.meta.dirname, 'test_artifacts')

beforeEach(async () => {
  await mkdirp(join(import.meta.dirname, 'test_artifacts'))
  await remove(ARTIFACT_PATH)
})

describe.each([
  {name: 'TypeScript', binPath: TS_BIN_PATH, isRust: false},
  {name: 'Rust', binPath: RUST_BIN_PATH!, isRust: true},
])('$name CLI', ({binPath, isRust}) => {
  test('basic case: help', async () => {
    await expect(exec(`${binPath} extract --help`)).resolves.toMatchSnapshot()
  }, 20000)

  test('basic case: defineMessages -> stdout', async () => {
    await expect(
      exec(
        `${binPath} extract --throws ${join(
          import.meta.dirname,
          'defineMessages/actual.jsx'
        )}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('flatten defineMessages -> stdout', async () => {
    await expect(
      exec(
        `${binPath} extract --flatten --throws ${join(
          import.meta.dirname,
          'defineMessages/actual.jsx'
        )}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('[glob] basic case: defineMessages -> stdout', async () => {
    await expect(
      exec(
        `${binPath} extract ${join(import.meta.dirname, 'defineMessages/*.jsx')}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('basic case: defineMessages -> out-file', async () => {
    process.chdir(import.meta.dirname)
    await expect(
      exec(
        `${binPath} extract defineMessages/actual.jsx --out-file ${ARTIFACT_PATH}/defineMessages/actual.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'defineMessages/actual.json'))
    ).toMatchSnapshot()
  }, 20000)

  test('basic case: inFile', async () => {
    process.chdir(import.meta.dirname)
    await expect(
      exec(
        `${binPath} extract --in-file inFile.txt --out-file ${ARTIFACT_PATH}/infile-actual.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'infile-actual.json'))
    ).toMatchSnapshot()
  })

  test('basic case: defineMessages -> out-file with  --additional-function-names', async () => {
    process.chdir(import.meta.dirname)
    await expect(
      exec(
        `${binPath} extract defineMessages/actual.jsx --additional-function-names t --out-file ${ARTIFACT_PATH}/defineMessages/actual.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'defineMessages/actual.json'))
    ).toMatchSnapshot()
  }, 20000)

  test('basic case: defineMessages -> out-file with location', async () => {
    process.chdir(import.meta.dirname)
    await expect(
      exec(
        `${binPath} extract defineMessages/actual.jsx --extract-source-location --out-file ${ARTIFACT_PATH}/defineMessages/actual.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'defineMessages/actual.json'))
    ).toMatchSnapshot()
  }, 20000)

  test('typescript -> stdout', async () => {
    await expect(
      exec(
        `${binPath} extract ${join(import.meta.dirname, 'typescript/actual.tsx')}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('typescript -> stdout with --additional-function-names', async () => {
    await expect(
      exec(
        `${binPath} extract --additional-function-names t ${join(import.meta.dirname, 'typescript/actual.tsx')}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('pragma', async () => {
    await expect(
      exec(
        `${binPath} extract --pragma intl ${join(
          import.meta.dirname,
          'typescript/pragma.tsx'
        )}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test.skipIf(isRust)(
    'typescript -> stdout with formatter',
    async () => {
      await expect(
        exec(
          `${binPath} extract ${join(
            import.meta.dirname,
            'typescript/actual.tsx'
          )} --format ${join(import.meta.dirname, '../formatter.js')}`
        )
      ).resolves.toMatchSnapshot()
    },
    20000
  )

  test('typescript -> stdout with transifex', async () => {
    await expect(
      exec(
        `${binPath} extract ${join(
          import.meta.dirname,
          'typescript/actual.tsx'
        )} --format transifex`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('typescript -> stdout with simple', async () => {
    await expect(
      exec(
        `${binPath} extract ${join(
          import.meta.dirname,
          'typescript/actual.tsx'
        )} --format simple`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('typescript -> stdout with lokalise', async () => {
    await expect(
      exec(
        `${binPath} extract ${join(
          import.meta.dirname,
          'typescript/actual.tsx'
        )} --format lokalise`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('typescript -> stdout with crowdin', async () => {
    await expect(
      exec(
        `${binPath} extract ${join(
          import.meta.dirname,
          'typescript/actual.tsx'
        )} --format crowdin`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('typescript -> stdout with smartling', async () => {
    await expect(
      exec(
        `${binPath} extract ${join(
          import.meta.dirname,
          'typescript/actual.tsx'
        )} --format smartling`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  const ignore = "--ignore '*.ignore.*'"

  test('ignore -> stdout TS', async () => {
    await expect(
      exec(
        `${binPath} extract --throws ${join(
          import.meta.dirname,
          'typescript/actual.tsx'
        )} ${ignore}`
      )
    ).resolves.toMatchSnapshot()
  }, 20000)

  test('ignore -> stdout JS', async () => {
    const jsResult = await exec(
      `${binPath} extract '${join(import.meta.dirname, 'defineMessages/*.jsx')}' ${ignore}`
    )
    expect(JSON.parse(jsResult.stdout)).toMatchSnapshot()
    expect(jsResult.stderr).toBe('')
  }, 20000)

  test('duplicated descriptor ids shows warning', async () => {
    const {stderr, stdout} = await exec(
      `${binPath} extract '${join(import.meta.dirname, 'duplicated/*.tsx')}'`
    )
    expect(JSON.parse(stdout)).toMatchSnapshot()
    expect(stderr).toContain('Duplicate message id: "foo"')
  }, 20000)

  test('duplicated descriptor ids throws', async () => {
    await expect(async () => {
      await exec(
        `${binPath} extract --throws '${join(import.meta.dirname, 'duplicated/*.tsx')}'`
      )
    }).rejects.toThrowError('Duplicate message id: "foo"')
  }, 20000)

  test('non duplicated descriptors does not throw', async () => {
    await expect(
      exec(
        `${binPath} extract --throws '${join(
          import.meta.dirname,
          'nonDuplicated/*.tsx'
        )}' --out-file ${ARTIFACT_PATH}/nonDuplicated/actual.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'nonDuplicated/actual.json'))
    ).toMatchSnapshot()
  }, 20000)

  test('invalid syntax should throw', async () => {
    await expect(async () => {
      await exec(
        `${binPath} extract --throws '${join(import.meta.dirname, 'typescript/err.tsx')}'`
      )
    }).rejects.toThrowError(isRust ? /Parse error/i : /TS1005/)
  }, 20000)

  // https://github.com/formatjs/formatjs/issues/4235
  test('#4235: non-static defaultMessage should throw with --throws', async () => {
    await expect(async () => {
      await exec(
        `${binPath} extract --throws '${join(import.meta.dirname, 'typescript/non-static.tsx')}'`
      )
    }).rejects.toThrowError(/defaultMessage.*must be a string literal/i)
  }, 20000)

  test('whitespace and newlines should be preserved', async () => {
    process.chdir(import.meta.dirname)
    await expect(
      exec(
        `${binPath} extract '${join(
          import.meta.dirname,
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
        `${binPath} extract --throws '${join(
          import.meta.dirname,
          'typescript/ts47.tsx'
        )}' --out-file ${ARTIFACT_PATH}/typescript/ts47.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'typescript/ts47.json'))
    ).toMatchSnapshot()
  })

  // https://github.com/formatjs/formatjs/issues/4489
  test('import meta', async () => {
    await expect(
      exec(
        `${binPath} extract --throws '${join(
          import.meta.dirname,
          'typescript/importMeta.mts'
        )}' --out-file ${ARTIFACT_PATH}/typescript/importMeta.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'typescript/importMeta.json'))
    ).toMatchSnapshot()
  })

  // https://github.com/formatjs/formatjs/issues/5069
  test('GH #5069: Tagged template expressions with substitutions in non-message props', async () => {
    await expect(
      exec(
        `${binPath} extract --throws '${join(
          import.meta.dirname,
          'taggedTemplates/actual.tsx'
        )}' --out-file ${ARTIFACT_PATH}/taggedTemplates/actual.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'taggedTemplates/actual.json'))
    ).toMatchSnapshot()
  })

  // https://github.com/formatjs/formatjs/issues/4471
  test('GH #4471: Optional chaining with generics in formatMessage', async () => {
    await expect(
      exec(
        `${binPath} extract --throws '${join(
          import.meta.dirname,
          'optionalChaining/actual.tsx'
        )}' --out-file ${ARTIFACT_PATH}/optionalChaining/actual.json`
      )
    ).resolves.toMatchSnapshot()

    expect(
      await readJSON(join(ARTIFACT_PATH, 'optionalChaining/actual.json'))
    ).toMatchSnapshot()
  })

  // https://github.com/formatjs/formatjs/issues/3537
  test('GH #3537: flatten with id-interpolation-pattern (content-based IDs)', async () => {
    const result = await exec(
      `${binPath} extract --throws --flatten --id-interpolation-pattern '[sha512:contenthash:base64:6]' '${join(
        import.meta.dirname,
        'flattenWithIdPattern/actual.js'
      )}'`
    )

    // Parse the JSON output
    const extracted = JSON.parse(result.stdout)

    // Verify messages are flattened - extract just defaultMessage field
    const messages = Object.values(extracted).map((msg: any) => ({
      defaultMessage: msg.defaultMessage,
    }))
    const sortedMessages = messages.sort((a, b) =>
      a.defaultMessage.localeCompare(b.defaultMessage)
    )

    // Check that both messages are flattened correctly
    expect(sortedMessages).toEqual([
      {
        defaultMessage:
          '{count,plural,one{I have a dog} other{I have many dogs}}',
      },
      {
        defaultMessage:
          '{topicCount,plural,one{{noteCount,plural,one{{topicCount, number} topic and # note} other{{topicCount, number} topic and # notes}}} other{{noteCount,plural,one{{topicCount, number} topics and # note} other{{topicCount, number} topics and # notes}}}}',
      },
    ])
  }, 20000)
})
