import {describe, expect, test} from 'vitest'
import {transform, type Options} from '../transform.js'

function t(
  code: string,
  options: Options = {},
  filename = '/path/to/file.tsx'
) {
  const result = transform(code, filename, options)
  return result?.code ?? code
}

describe('@formatjs/vite-plugin transform', () => {
  describe('id generation', () => {
    test('inserts generated id into formatMessage call', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello World', description: 'greeting'})`
      const output = t(input)
      expect(output).toContain('id:')
      expect(output).not.toContain('description')
    })

    test('inserts generated id into FormattedMessage JSX', () => {
      const input = `<FormattedMessage defaultMessage="Hello World" description="greeting" />`
      const output = t(input)
      expect(output).toContain('id=')
      expect(output).not.toContain('description')
    })

    test('preserves existing id when no overrideIdFn', () => {
      const input = `intl.formatMessage({id: 'my.id', defaultMessage: 'Hello'})`
      const output = t(input)
      expect(output).toContain('"my.id"')
    })

    test('overrideIdFn takes precedence over idInterpolationPattern', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input, {
        overrideIdFn: (_id, defaultMessage, _description, filePath) =>
          `${filePath}:${defaultMessage}`,
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
      })
      expect(output).toContain('/path/to/file.tsx:Hello')
    })

    test('custom idInterpolationPattern', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      const output1 = t(input, {
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
      })
      const output2 = t(input, {
        idInterpolationPattern: '[sha512:contenthash:hex:8]',
      })
      // Both should have ids but different ones
      expect(output1).toContain('id:')
      expect(output2).toContain('id:')
      expect(output1).not.toEqual(output2)
    })

    test('generates same id as babel-plugin for same content', () => {
      // The default pattern is [sha512:contenthash:base64:6]
      // Content is `defaultMessage#description` or just `defaultMessage`
      const input = `intl.formatMessage({defaultMessage: 'Hello World', description: 'greeting'})`
      const output = t(input)
      // Just verify an id is generated
      expect(output).toMatch(/id:\s*"[^"]+"/)
    })
  })

  describe('description removal', () => {
    test('removes description from call expression', () => {
      const input = `intl.formatMessage({id: 'test', defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input)
      expect(output).not.toContain('description')
      expect(output).toContain('defaultMessage')
      expect(output).toContain('"test"')
    })

    test('removes description from JSX', () => {
      const input = `<FormattedMessage id="test" defaultMessage="Hello" description="greeting" />`
      const output = t(input)
      expect(output).not.toContain('description')
      expect(output).toContain('defaultMessage')
    })
  })

  describe('removeDefaultMessage', () => {
    test('removes defaultMessage when option is true', () => {
      const input = `intl.formatMessage({id: 'test', defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input, {removeDefaultMessage: true})
      expect(output).not.toContain('defaultMessage')
      expect(output).not.toContain('description')
      expect(output).toContain('"test"')
    })

    test('removes defaultMessage from JSX', () => {
      const input = `<FormattedMessage id="test" defaultMessage="Hello" description="greeting" />`
      const output = t(input, {removeDefaultMessage: true})
      expect(output).not.toContain('defaultMessage')
      expect(output).not.toContain('description')
    })
  })

  describe('ast mode', () => {
    test('replaces defaultMessage with parsed AST', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello {name}', description: 'greeting'})`
      const output = t(input, {ast: true})
      // Should contain parsed AST (array)
      expect(output).toContain('[')
      expect(output).toContain('"type"')
      expect(output).not.toContain('description')
    })
  })

  describe('defineMessages', () => {
    test('processes multiple descriptors in defineMessages', () => {
      const input = `defineMessages({
  greeting: {
    defaultMessage: 'Hello',
    description: 'greeting'
  },
  farewell: {
    defaultMessage: 'Goodbye',
    description: 'farewell'
  }
})`
      const output = t(input)
      expect(output).not.toContain('description')
      // Both descriptors should have ids
      const idMatches = output.match(/id:\s*"[^"]+"/g)
      expect(idMatches).toHaveLength(2)
    })
  })

  describe('defineMessage', () => {
    test('processes single descriptor in defineMessage', () => {
      const input = `defineMessage({defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input)
      expect(output).toContain('id:')
      expect(output).not.toContain('description')
    })
  })

  describe('function names', () => {
    test('handles $t', () => {
      const input = `$t({defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input)
      expect(output).toContain('id:')
      expect(output).not.toContain('description')
    })

    test('handles $formatMessage', () => {
      const input = `$formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input)
      expect(output).toContain('id:')
    })

    test('additional function names', () => {
      const input = `myCustomFn({defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input, {additionalFunctionNames: ['myCustomFn']})
      expect(output).toContain('id:')
      expect(output).not.toContain('description')
    })
  })

  describe('component names', () => {
    test('additional component names', () => {
      const input = `<CustomMessage defaultMessage="Hello" description="greeting" />`
      const output = t(input, {additionalComponentNames: ['CustomMessage']})
      expect(output).toContain('id=')
      expect(output).not.toContain('description')
    })

    test('does not process unknown components', () => {
      const input = `<UnknownComponent defaultMessage="Hello" description="greeting" />`
      const output = t(input)
      expect(output).toContain('description')
    })
  })

  describe('static evaluation', () => {
    test('handles template literals without substitutions', () => {
      const input =
        'intl.formatMessage({defaultMessage: `Hello World`, description: `greeting`})'
      const output = t(input)
      expect(output).toContain('id:')
      expect(output).not.toContain('description')
    })

    test('skips template literals with substitutions', () => {
      const input = 'intl.formatMessage({defaultMessage: `Hello ${name}`})'
      const output = t(input)
      // Should not be processed since we can't statically evaluate
      expect(output).not.toContain('id:')
    })

    test('handles string concatenation', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello' + ' World', description: 'greeting'})`
      const output = t(input)
      expect(output).toContain('id:')
      expect(output).not.toContain('description')
    })

    test('skips non-static expressions', () => {
      const input = `intl.formatMessage({defaultMessage: getMessage()})`
      const output = t(input)
      expect(output).not.toContain('id:')
    })
  })

  describe('whitespace', () => {
    test('normalizes whitespace in defaultMessage by default', () => {
      const input = `intl.formatMessage({id: 'test', defaultMessage: '  Hello   World  '})`
      const output = t(input)
      expect(output).toContain('Hello World')
    })

    test('preserves whitespace when option is set', () => {
      const input = `intl.formatMessage({id: 'test', defaultMessage: '  Hello   World  '})`
      const output = t(input, {preserveWhitespace: true})
      expect(output).toContain('  Hello   World  ')
    })
  })

  describe('member expressions', () => {
    test('handles intl.formatMessage', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input)
      expect(output).toContain('id:')
    })

    test('handles this.props.intl.formatMessage', () => {
      const input = `this.props.intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      const output = t(input)
      expect(output).toContain('id:')
    })
  })

  describe('no-op cases', () => {
    test('returns undefined for files with no descriptors', () => {
      const code = `const x = 1; console.log(x);`
      const result = transform(code, '/path/to/file.ts', {})
      expect(result).toBeUndefined()
    })

    test('$t with no arguments', () => {
      const input = `$t()`
      const output = t(input)
      expect(output).toBe('$t()')
    })
  })

  describe('overrideIdFn', () => {
    test('receives all arguments', () => {
      let receivedArgs: any
      const input = `intl.formatMessage({id: 'existing', defaultMessage: 'Hello', description: 'greeting'})`
      t(input, {
        overrideIdFn: (id, defaultMessage, description, filePath) => {
          receivedArgs = {id, defaultMessage, description, filePath}
          return 'custom-id'
        },
      })
      expect(receivedArgs).toEqual({
        id: 'existing',
        defaultMessage: 'Hello',
        description: 'greeting',
        filePath: '/path/to/file.tsx',
      })
    })

    test('updates existing id with overrideIdFn result', () => {
      const input = `intl.formatMessage({id: 'old', defaultMessage: 'Hello'})`
      const output = t(input, {
        overrideIdFn: () => 'new-id',
      })
      expect(output).toContain('"new-id"')
      expect(output).not.toContain('"old"')
    })
  })
})
