import {transformSync} from '@babel/core'
import {Runfiles} from '@bazel/runfiles'
import {transform} from '@formatjs/unplugin/transform'
import babelPlugin from 'babel-plugin-formatjs'
import {execFile as nodeExecFile} from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {promisify} from 'node:util'
import {afterAll, expect, test} from 'vitest'

const execFile = promisify(nodeExecFile)
const binary = new Runfiles().resolveWorkspaceRelative(
  'crates/formatjs_cli/formatjs_cli'
)
const directory = mkdtempSync(join(tmpdir(), 'babel-conformance-'))
afterAll(() => rmSync(directory, {recursive: true, force: true}))

const wrappers = [
  {name: 'plain', wrap: (value: string) => value},
  {name: 'parentheses', wrap: (value: string) => `(${value})`},
  {name: 'as', wrap: (value: string) => `${value} as const`},
  {name: 'satisfies', wrap: (value: string) => `${value} satisfies Message`},
  {name: 'non-null', wrap: (value: string) => `${value}!`},
  {name: 'type assertion', wrap: (value: string) => `<Message>${value}`},
  {
    name: 'nested',
    wrap: (value: string) => `(${value} as const satisfies Message)!`,
  },
]

async function assertConformance(source: string, jsx = false) {
  const filename = join(directory, jsx ? 'messages.tsx' : 'messages.ts')
  writeFileSync(filename, source)
  const {stdout} = await execFile(binary, ['extract', '--flatten', filename])
  const cli = JSON.parse(stdout)
  expect(cli).toEqual({
    'MJezg/': {defaultMessage: 'Hello', description: 'Greeting'},
  })

  const messages: {
    id: string
    defaultMessage?: string
    description?: string
  }[] = []
  const babel = transformSync(source, {
    filename,
    configFile: false,
    babelrc: false,
    parserOpts: {
      plugins: jsx ? ['typescript', 'jsx'] : ['typescript'],
      createParenthesizedExpressions: true,
    },
    plugins: [
      [
        babelPlugin,
        {
          flatten: true,
          onMsgExtracted: (_: string, extracted: typeof messages) =>
            messages.push(...extracted),
        },
      ],
    ],
  })!
  expect(messages).toEqual([{id: 'MJezg/', ...cli['MJezg/']}])

  const unplugin = transform(source, filename, {})
  expect(unplugin).toBeDefined()
  for (const code of [babel.code!, unplugin!.code]) {
    const ids = [...code.matchAll(/\bid(?::\s*|=)"([^"]+)"/g)].map(
      match => match[1]
    )
    expect(ids).toEqual(Object.keys(cli))
  }
}

for (const {name, wrap} of wrappers) {
  const descriptor = wrap(
    `{defaultMessage: ${wrap('"Hello"')}, description: ${wrap('"Greeting"')}}`
  )
  test.each(['intl.formatMessage', 'intl?.formatMessage?.', 'defineMessage'])(
    `${name}: %s descriptor and values`,
    async callee => {
      await assertConformance(`${callee}(${descriptor})`)
    }
  )
  test(`${name}: defineMessages map, entry, and values`, async () => {
    await assertConformance(`defineMessages(${wrap(`{hello: ${descriptor}}`)})`)
  })
  if (name !== 'type assertion') {
    test(`${name}: JSX values`, async () => {
      await assertConformance(
        `<FormattedMessage defaultMessage={${wrap('`Hello`')}} description={${wrap('"Greeting"')}} />`,
        true
      )
    })
  }
}
