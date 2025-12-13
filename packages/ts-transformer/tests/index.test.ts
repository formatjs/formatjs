import {join} from 'path'
import {transform, Opts, MessageDescriptor} from '../'
import * as ts from 'typescript'
import {readFile as readFileAsync} from 'fs'
import {promisify} from 'util'
import {describe, it, expect} from 'vitest'

const readFile = promisify(readFileAsync)

const FIXTURES_DIR = join(__dirname, 'fixtures')

describe('emit asserts for', function () {
  it('additionalComponentNames', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'additionalComponentNames.tsx'),
      {
        additionalComponentNames: ['CustomMessage'],
        pragma: 'react-intl',
      }
    )
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({
      project: 'foo',
    })
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'Greeting to the world',
        id: 'greeting-world',
      },
    ])
  })

  it('additionalFunctionNames', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'additionalFunctionNames.tsx'),
      {
        additionalFunctionNames: ['$formatMessage'],
        pragma: 'react-intl',
      }
    )
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({
      project: 'foo',
    })
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'foo',
        id: 'rL0Y20zC+F',
      },
      {
        defaultMessage: 'foo',
        id: 'rL0Y20zC+F',
      },
    ])
  })

  it('defineMessages', async function () {
    const output = await compile(join(FIXTURES_DIR, 'defineMessages.tsx'), {
      pragma: 'react-intl',
    })
    expect(output.meta).toEqual({
      file: 'bar',
      project: 'foo',
    })
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'The default message',
        id: 'foo.bar.baz',
      },
      {
        defaultMessage: 'Hello Nurse!',
        description: 'Another message',
        id: 'foo.bar.biff',
      },
      {
        defaultMessage:
          '{count, plural, =0 {😭} one {# kitten} other {# kittens}}',
        description: 'Counts kittens',
        id: 'app.home.kittens',
      },
      {
        defaultMessage: 'Some whitespace',
        description: 'Whitespace',
        id: 'trailing.ws',
      },
      {
        defaultMessage: "A quoted value ''{value}'",
        description: 'Escaped apostrophe',
        id: 'escaped.apostrophe',
      },
      {
        defaultMessage: "What's going on",
        description: 'Escaped apostrophe',
        id: 'escaped.apostrophe',
      },
      {
        defaultMessage: 'this is a message',
        description: 'this is     a     description',
        id: 'newline',
      },
      {
        defaultMessage: 'formatted message',
        description: 'foo',
        id: 'inline',
      },
    ])
  })

  it('extractFromFormatMessage', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'extractFromFormatMessage.tsx'),
      {
        pragma: 'react-intl',
      }
    )
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'The default message',
        id: 'foo.bar.baz',
      },
      {
        defaultMessage: 'Hello Nurse!',
        description: 'Another message',
        id: 'foo.bar.biff',
      },
      {
        defaultMessage: 'inline',
        id: 'A/2tFVt1SI',
      },
      {
        defaultMessage: 'bar',
        description: 'baz',
        id: 'foo',
      },
    ])
  })

  it('extractFromFormatMessageStateless', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'extractFromFormatMessageStateless.tsx'),
      {}
    )
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello params!',
        description: 'A stateless message',
        id: 'inline1',
      },
      {
        defaultMessage: 'hook',
        description: 'hook',
        id: 'hook',
      },
      {
        defaultMessage: 'Hello Stateless!',
        description: 'A stateless message',
        id: 'foo.bar.quux',
      },
      {
        defaultMessage: 'bar',
        description: 'baz',
        id: 'foo',
      },
    ])
  })

  it('formattedMessage', async function () {
    const output = await compile(join(FIXTURES_DIR, 'FormattedMessage.tsx'), {})
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World! {foo, number}',
        description: 'The default message.',
        id: 'foo.bar.baz',
      },
      {
        defaultMessage: 'Hello World! {foo, number}',
        description: 'The default message.',
        id: 'foo.bar.baz',
      },
      {
        defaultMessage: 'Hello World! {foo, number}',
        description: 'The default message.',
        id: 'foo.bar.baz',
      },
    ])
  })

  it('inline', async function () {
    const output = await compile(join(FIXTURES_DIR, 'inline.tsx'), {})
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'The default message.',
        id: 'foo.bar.baz',
      },
      {
        defaultMessage: 'Hello World!',
        description: 'The default message',
        id: 'header',
      },
      {
        defaultMessage: 'Hello World!',
        description: 'The default message',
        id: 'header2',
      },
    ])
  })

  it('nested', async function () {
    const output = await compile(join(FIXTURES_DIR, 'nested.tsx'), {
      overrideIdFn: (id, defaultMessage, description) => {
        return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
      },
    })
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'layer1 {name}',
        id: 'HELLO..13.undefined',
      },
      {
        defaultMessage: 'layer2',
        id: 'HELLO..6.undefined',
      },
    ])
  })

  it('[special] extractSourceLocation', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'extractSourceLocation.tsx'),
      {
        extractSourceLocation: true,
      }
    )
    expect(output.code).toMatchSnapshot()
    expect(output.msgs).toHaveLength(1)
    expect(output.msgs[0]).toEqual({
      defaultMessage: 'Hello World!',
      end: 220,
      file: expect.stringContaining('extractSourceLocation.tsx'),
      id: 'foo.bar.baz',
      start: 152,
    })
  })

  it('descriptionsAsObjects', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'descriptionsAsObjects.tsx'),
      {}
    )
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: {
          metadata: 'Additional metadata content.',
          text: 'Something for the translator.',
        },
        id: 'foo.bar.baz',
      },
    ])
  })

  it('formatMessageCall', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'formatMessageCall.tsx'),
      {}
    )
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'The default message',
        id: 'foo.bar.baz',
      },
      {
        defaultMessage: 'Hello World!',
        description: 'The default message $$$',
        id: 'foo.bar.baz2',
      },
      {
        defaultMessage: 'Hello Nurse!',
        description: 'Another message',
        id: 'foo.bar.biff',
      },
      {
        defaultMessage: 'inline',
        id: 'A/2tFVt1SI',
      },
      {
        defaultMessage: 'bar',
        description: 'baz',
        id: 'foo',
      },
    ])
  })

  it('stringConcat', async function () {
    const output = await compile(join(FIXTURES_DIR, 'stringConcat.tsx'), {})
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!farbaz',
        description: 'The default message.',
        id: 'foo.bar.bazid',
      },
      {
        defaultMessage: 'Hello World!foobar',
        description: 'The default message',
        id: 'header',
      },
      {
        defaultMessage: 'Hello World!',
        description: 'The default message asd',
        id: 'header2',
      },
    ])
  })

  it('templateLiteral', async function () {
    const output = await compile(join(FIXTURES_DIR, 'templateLiteral.tsx'), {})
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'should remove newline and extra spaces',
        id: 'template',
      },
      {
        defaultMessage: 'dedent Hello World!',
        id: 'template dedent',
      },
      {
        defaultMessage: 'Hello World!',
        description: 'The default message.',
        id: 'foo.bar.baz',
      },
      {
        defaultMessage: 'dedent Hello World!',
        description: 'The default message.',
        id: 'dedent foo.bar.baz',
      },
    ])
  })

  it('overrideIdFn', async function () {
    const output = await compile(join(FIXTURES_DIR, 'overrideIdFn.tsx'), {
      overrideIdFn: (id, defaultMessage, description) => {
        return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
      },
    })
    expect(output.code).toContain('id: "HELLO.foo.bar.baz.12.string"')
    expect(output.code).toContain('id: "HELLO.foo.bar.biff.12.object"')
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'The default message',
        id: 'HELLO.foo.bar.baz.12.string',
      },
      {
        defaultMessage: 'Hello Nurse!',
        description: {
          metadata: 'Additional metadata content.',
          text: 'Something for the translator.',
        },
        id: 'HELLO.foo.bar.biff.12.object',
      },
      {
        defaultMessage: 'defineMessage',
        description: 'foo',
        id: 'HELLO..13.string',
      },
      {
        defaultMessage: 'no-id',
        description: 'no-id',
        id: 'HELLO..5.string',
      },
      {
        defaultMessage: 'intl.formatMessage',
        description: 'no-id',
        id: 'HELLO..18.string',
      },
      {
        defaultMessage: 'formatMessage',
        description: 'no-id',
        id: 'HELLO..13.string',
      },
      {
        defaultMessage: 'Hello World! {abc}',
        description: {
          metadata: 'Additional metadata content.',
          text: 'Something for the translator. Another description',
        },
        id: 'HELLO.foo.bar.zoo.18.object',
      },
      {
        defaultMessage: 'Hello World! {abc}',
        description: {
          metadata: 'Additional metadata content.',
          text: 'Something for the translator. Another description',
        },
        id: 'HELLO..18.object',
      },
    ])
  })

  it('ast', async function () {
    const output = await compile(join(FIXTURES_DIR, 'ast.tsx'), {
      ast: true,
      overrideIdFn: (id, defaultMessage, description) => {
        return `HELLO.${id}.${defaultMessage!.length}.${typeof description}`
      },
    })
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'The default message',
        id: 'HELLO.foo.bar.baz.12.string',
      },
      {
        defaultMessage: 'Hello Nurse!',
        description: {
          metadata: 'Additional metadata content.',
          text: 'Something for the translator.',
        },
        id: 'HELLO.foo.bar.biff.12.object',
      },
      {
        defaultMessage: 'defineMessage',
        description: 'foo',
        id: 'HELLO..13.string',
      },
      {
        defaultMessage: 'no-id',
        description: 'no-id',
        id: 'HELLO..5.string',
      },
      {
        defaultMessage: 'intl.formatMessage',
        description: 'no-id',
        id: 'HELLO..18.string',
      },
      {
        defaultMessage: 'formatMessage',
        description: 'no-id',
        id: 'HELLO..13.string',
      },
      {
        defaultMessage: '{count, plural, =0 {zero} other{other}}',
        description: 'no-id',
        id: 'HELLO..39.string',
      },
      {
        defaultMessage: 'Hello World! {abc}',
        description: {
          metadata: 'Additional metadata content.',
          text: 'Something for the translator. Another description',
        },
        id: 'HELLO.foo.bar.zoo.18.object',
      },
      {
        defaultMessage: 'Hello World! {abc}',
        description: {
          metadata: 'Additional metadata content.',
          text: 'Something for the translator. Another description',
        },
        id: 'HELLO..18.object',
      },
      {
        defaultMessage: '{value, number}',
        description: {
          metadata: 'number',
          text: 'number',
        },
        id: 'HELLO..15.object',
      },
    ])
  })

  it('removeDefaultMessage', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'removeDefaultMessage.tsx'),
      {
        removeDefaultMessage: true,
      }
    )
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'Greeting to the world',
        id: 'greeting-world',
      },
    ])
  })

  it('noImport', async function () {
    const output = await compile(join(FIXTURES_DIR, 'noImport.tsx'), {
      overrideIdFn: '[hash:base64:5]',
    })
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'props {intl}',
        description: 'bar',
        id: 'hYpBl',
      },
      {
        defaultMessage: 'this props {intl}',
        description: 'bar',
        id: 'tBZlS',
      },
      {
        defaultMessage: 'this props {intl}',
        description: {
          obj1: 1,
          obj2: '123',
        },
        id: 'T+ycr',
      },
      {
        defaultMessage: 'this props {intl}',
        description: {
          obj1: 1,
          obj2: '123',
        },
        id: 'T+ycr',
      },
      {
        defaultMessage: 'this props {intl}',
        description: {
          obj2: '123',
        },
        id: 'WUKCt',
      },
      {
        defaultMessage: 'foo {bar}',
        description: 'bar',
        id: 'ALfyd',
      },
    ])
  })

  it('resourcePath', async function () {
    const output = await compile(join(FIXTURES_DIR, 'resourcePath.tsx'), {
      overrideIdFn: '[name]-[hash:base64:5]',
    })
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'props {intl}',
        description: 'bar',
        id: 'resourcePath-hYpBl',
      },
      {
        defaultMessage: 'this props {intl}',
        description: 'bar',
        id: 'resourcePath-tBZlS',
      },
      {
        defaultMessage: 'foo {bar}',
        description: 'bar',
        id: 'resourcePath-ALfyd',
      },
    ])
  })

  it('removeDescription', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'removeDescription.tsx'),
      {}
    )
    expect(output.code).toMatchSnapshot()
    expect(output.meta).toEqual({})
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'Greeting to the world',
        id: 'greeting-world',
      },
    ])
  })

  it('defineMessagesPreserveWhitespace', async function () {
    const output = await compile(
      join(FIXTURES_DIR, 'defineMessagesPreserveWhitespace.tsx'),
      {
        pragma: 'react-intl',
        preserveWhitespace: true,
      }
    )
    expect(output.code).toContain('   Some whitespace   ')
    expect(output.meta).toEqual({
      file: 'bar',
      project: 'foo',
    })
    expect(output.msgs).toEqual([
      {
        defaultMessage: 'Hello World!',
        description: 'The default message',
        id: 'foo.bar.baz',
      },
      {
        defaultMessage: 'Hello Nurse!',
        description: 'Another message',
        id: 'foo.bar.biff',
      },
      {
        defaultMessage:
          '{count, plural, =0 {😭} one {# kitten} other {# kittens}}',
        description: 'Counts kittens',
        id: 'app.home.kittens',
      },
      {
        defaultMessage: '   Some whitespace   ',
        description: 'Whitespace',
        id: 'trailing.ws',
      },
      {
        defaultMessage: "A quoted value ''{value}'",
        description: 'Escaped apostrophe',
        id: 'escaped.apostrophe',
      },
      {
        defaultMessage: "What's going on",
        description: 'Escaped apostrophe',
        id: 'escaped.apostrophe',
      },
      {
        defaultMessage: 'this is     a message',
        description: 'this is     a     description',
        id: 'newline',
      },
      {
        defaultMessage: 'this is\na message',
        description: 'this is\na\ndescription',
        id: 'linebreak',
      },
      {
        defaultMessage: 'this is\n    a message',
        description: 'this is\n    a\n    description',
        id: 'templateLinebreak',
      },
      {
        defaultMessage: 'formatted message',
        description: 'foo',
        id: 'inline',
      },
      {
        defaultMessage: 'formatted message\n\t\t\t\t\t\twith linebreak',
        description: 'foo\n\t\t\t\t\t\tbar',
        id: 'inline.linebreak',
      },
    ])
  })
})

async function compile(filePath: string, options?: Partial<Opts>) {
  let msgs: MessageDescriptor[] = []
  let meta: Record<string, string> = {}
  const input = await readFile(filePath, 'utf8')
  const output = ts.transpileModule(input, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      allowJs: true,
    },
    fileName: filePath,
    reportDiagnostics: true,
    transformers: {
      before: [
        transform({
          overrideIdFn: '[hash:base64:10]',
          onMsgExtracted: (_, extractedMsgs) => {
            msgs = msgs.concat(extractedMsgs)
          },
          onMetaExtracted: (_, m) => {
            meta = m
          },
          ...options,
        }),
      ],
    },
  })
  return {
    msgs,
    meta,
    code: output.outputText,
  }
}
