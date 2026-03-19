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

describe('@formatjs/unplugin transform', () => {
  describe('id generation', () => {
    test('inserts generated id into formatMessage call', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello World', description: 'greeting'})`
      expect(t(input)).toBe(
        `intl.formatMessage({id: "zsxcPt", defaultMessage: 'Hello World',})`
      )
    })

    test('inserts generated id into FormattedMessage JSX', () => {
      const input = `<FormattedMessage defaultMessage="Hello World" description="greeting" />`
      expect(t(input)).toBe(
        `<FormattedMessage id="zsxcPt" defaultMessage="Hello World" />`
      )
    })

    test('preserves existing id when no overrideIdFn', () => {
      const input = `intl.formatMessage({id: 'my.id', defaultMessage: 'Hello'})`
      expect(t(input)).toBe(
        `intl.formatMessage({id: "my.id", defaultMessage: 'Hello'})`
      )
    })

    test('overrideIdFn takes precedence over idInterpolationPattern', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      expect(
        t(input, {
          overrideIdFn: (_id, defaultMessage, _description, filePath) =>
            `${filePath}:${defaultMessage}`,
          idInterpolationPattern: '[sha512:contenthash:base64:6]',
        })
      ).toBe(
        `intl.formatMessage({id: "/path/to/file.tsx:Hello", defaultMessage: 'Hello',})`
      )
    })

    test('custom idInterpolationPattern', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      expect(
        t(input, {idInterpolationPattern: '[sha512:contenthash:base64:6]'})
      ).toBe(`intl.formatMessage({id: "K+VETU", defaultMessage: 'Hello',})`)
      expect(
        t(input, {idInterpolationPattern: '[sha512:contenthash:hex:8]'})
      ).toBe(`intl.formatMessage({id: "2be5444d", defaultMessage: 'Hello',})`)
    })

    test('generates same id as babel-plugin for same content', () => {
      // The default pattern is [sha512:contenthash:base64:6]
      // Content is `defaultMessage#description` or just `defaultMessage`
      const input = `intl.formatMessage({defaultMessage: 'Hello World', description: 'greeting'})`
      expect(t(input)).toBe(
        `intl.formatMessage({id: "zsxcPt", defaultMessage: 'Hello World',})`
      )
    })
  })

  describe('description removal', () => {
    test('removes description from call expression', () => {
      const input = `intl.formatMessage({id: 'test', defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input)).toBe(
        `intl.formatMessage({id: "test", defaultMessage: 'Hello',})`
      )
    })

    test('removes description from JSX', () => {
      const input = `<FormattedMessage id="test" defaultMessage="Hello" description="greeting" />`
      expect(t(input)).toBe(
        `<FormattedMessage id="test" defaultMessage="Hello" />`
      )
    })

    test('removes description from single-line JSX when description precedes defaultMessage', () => {
      // Regression test for: https://github.com/formatjs/formatjs/issues/6164
      // When description comes before defaultMessage on the same line, the
      // generated code must preserve a space between the tag name and defaultMessage,
      // and the generated id must not be swallowed by the description removal.
      const input = `<FormattedMessage description="Test" defaultMessage="Test" />`
      expect(t(input)).toBe(
        `<FormattedMessage id="Sz8KN3" defaultMessage="Test" />`
      )
    })
  })

  describe('removeDefaultMessage', () => {
    test('removes defaultMessage when option is true', () => {
      const input = `intl.formatMessage({id: 'test', defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input, {removeDefaultMessage: true})).toBe(
        `intl.formatMessage({id: "test",})`
      )
    })

    test('removes defaultMessage from JSX', () => {
      const input = `<FormattedMessage id="test" defaultMessage="Hello" description="greeting" />`
      expect(t(input, {removeDefaultMessage: true})).toBe(
        `<FormattedMessage id="test" />`
      )
    })
  })

  describe('ast mode', () => {
    test('replaces defaultMessage with parsed AST', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello {name}', description: 'greeting'})`
      expect(t(input, {ast: true})).toBe(
        `intl.formatMessage({id: "5M51BK", defaultMessage: [{"type":0,"value":"Hello "},{"type":1,"value":"name"}],})`
      )
    })

    test('wraps JSX defaultMessage AST in expression container', () => {
      const input = `<FormattedMessage id="test" defaultMessage="Hello World" />`
      expect(t(input, {ast: true})).toBe(
        `<FormattedMessage id="test" defaultMessage={[{"type":0,"value":"Hello World"}]} />`
      )
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
      expect(t(input)).toBe(`defineMessages({
  greeting: {id: "K+VETU",${' '}
    defaultMessage: 'Hello',

  },
  farewell: {id: "LELdIQ",${' '}
    defaultMessage: 'Goodbye',

  }
})`)
    })
  })

  describe('defineMessage', () => {
    test('processes single descriptor in defineMessage', () => {
      const input = `defineMessage({defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input)).toBe(
        `defineMessage({id: "K+VETU", defaultMessage: 'Hello',})`
      )
    })
  })

  describe('function names', () => {
    test('handles $t', () => {
      const input = `$t({defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input)).toBe(`$t({id: "K+VETU", defaultMessage: 'Hello',})`)
    })

    test('handles $formatMessage', () => {
      const input = `$formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input)).toBe(
        `$formatMessage({id: "K+VETU", defaultMessage: 'Hello',})`
      )
    })

    test('additional function names', () => {
      const input = `myCustomFn({defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input, {additionalFunctionNames: ['myCustomFn']})).toBe(
        `myCustomFn({id: "K+VETU", defaultMessage: 'Hello',})`
      )
    })
  })

  describe('component names', () => {
    test('additional component names', () => {
      const input = `<CustomMessage defaultMessage="Hello" description="greeting" />`
      expect(t(input, {additionalComponentNames: ['CustomMessage']})).toBe(
        `<CustomMessage id="K+VETU" defaultMessage="Hello" />`
      )
    })

    test('does not process unknown components', () => {
      const input = `<UnknownComponent defaultMessage="Hello" description="greeting" />`
      expect(t(input)).toBe(input)
    })
  })

  describe('static evaluation', () => {
    test('handles template literals without substitutions', () => {
      const input =
        'intl.formatMessage({defaultMessage: `Hello World`, description: `greeting`})'
      expect(t(input)).toBe(
        'intl.formatMessage({id: "zsxcPt", defaultMessage: `Hello World`,})'
      )
    })

    test('skips template literals with substitutions', () => {
      const input = 'intl.formatMessage({defaultMessage: `Hello ${name}`})'
      expect(t(input)).toBe(input)
    })

    test('handles string concatenation', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello' + ' World', description: 'greeting'})`
      expect(t(input)).toBe(
        `intl.formatMessage({id: "zsxcPt", defaultMessage: 'Hello' + ' World',})`
      )
    })

    test('skips non-static expressions', () => {
      const input = `intl.formatMessage({defaultMessage: getMessage()})`
      expect(t(input)).toBe(input)
    })
  })

  describe('whitespace', () => {
    test('normalizes whitespace in defaultMessage by default', () => {
      const input = `intl.formatMessage({id: 'test', defaultMessage: '  Hello   World  '})`
      expect(t(input)).toBe(
        `intl.formatMessage({id: "test", defaultMessage: "Hello World"})`
      )
    })

    test('preserves whitespace when option is set', () => {
      const input = `intl.formatMessage({id: 'test', defaultMessage: '  Hello   World  '})`
      expect(t(input, {preserveWhitespace: true})).toBe(
        `intl.formatMessage({id: "test", defaultMessage: '  Hello   World  '})`
      )
    })
  })

  describe('member expressions', () => {
    test('handles intl.formatMessage', () => {
      const input = `intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input)).toBe(
        `intl.formatMessage({id: "K+VETU", defaultMessage: 'Hello',})`
      )
    })

    test('handles this.props.intl.formatMessage', () => {
      const input = `this.props.intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input)).toBe(
        `this.props.intl.formatMessage({id: "K+VETU", defaultMessage: 'Hello',})`
      )
    })
  })

  describe('compiled JSX', () => {
    test('handles _jsx(FormattedMessage, { ... })', () => {
      const input = `_jsx(FormattedMessage, { defaultMessage: 'Hello World', description: 'greeting' })`
      expect(t(input)).toBe(
        `_jsx(FormattedMessage, {id: "zsxcPt",  defaultMessage: 'Hello World',})`
      )
    })

    test('handles jsxDEV(FormattedMessage, { ... })', () => {
      const input = `jsxDEV(FormattedMessage, { defaultMessage: 'Hello World', description: 'greeting' })`
      expect(t(input)).toBe(
        `jsxDEV(FormattedMessage, {id: "zsxcPt",  defaultMessage: 'Hello World',})`
      )
    })

    test('handles _jsxs(FormattedMessage, { ... })', () => {
      const input = `_jsxs(FormattedMessage, { defaultMessage: 'Hello World', description: 'greeting' })`
      expect(t(input)).toBe(
        `_jsxs(FormattedMessage, {id: "zsxcPt",  defaultMessage: 'Hello World',})`
      )
    })

    test('handles React.createElement(FormattedMessage, { ... })', () => {
      const input = `React.createElement(FormattedMessage, { defaultMessage: 'Hello World', description: 'greeting' })`
      expect(t(input)).toBe(
        `React.createElement(FormattedMessage, {id: "zsxcPt",  defaultMessage: 'Hello World',})`
      )
    })

    test('preserves existing id in compiled JSX', () => {
      const input = `_jsx(FormattedMessage, { id: 'my.id', defaultMessage: 'Hello', description: 'greeting' })`
      expect(t(input)).toBe(
        `_jsx(FormattedMessage, { id: "my.id", defaultMessage: 'Hello',})`
      )
    })

    test('does not process unknown components in compiled JSX', () => {
      const input = `_jsx(UnknownComponent, { defaultMessage: 'Hello', description: 'greeting' })`
      expect(t(input)).toBe(input)
    })

    test('handles additional component names in compiled JSX', () => {
      const input = `_jsx(CustomMessage, { defaultMessage: 'Hello', description: 'greeting' })`
      expect(t(input, {additionalComponentNames: ['CustomMessage']})).toBe(
        `_jsx(CustomMessage, {id: "K+VETU",  defaultMessage: 'Hello',})`
      )
    })

    test('removeDefaultMessage works with compiled JSX', () => {
      const input = `_jsx(FormattedMessage, { id: 'test', defaultMessage: 'Hello', description: 'greeting' })`
      expect(t(input, {removeDefaultMessage: true})).toBe(
        `_jsx(FormattedMessage, { id: "test",})`
      )
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
      expect(t(input)).toBe('$t()')
    })
  })

  describe('nested AST traversal', () => {
    test('processes descriptors inside arrow functions', () => {
      const input = `const fn = () => intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`
      expect(t(input)).toBe(
        `const fn = () => intl.formatMessage({id: "K+VETU", defaultMessage: 'Hello',})`
      )
    })

    test('processes descriptors inside nested function calls', () => {
      const input = `console.log(intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'}))`
      expect(t(input)).toBe(
        `console.log(intl.formatMessage({id: "K+VETU", defaultMessage: 'Hello',}))`
      )
    })

    test('processes descriptors inside class methods', () => {
      const input = `class Foo {
  render() {
    return intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})
  }
}`
      expect(t(input)).toBe(`class Foo {
  render() {
    return intl.formatMessage({id: "K+VETU", defaultMessage: 'Hello',})
  }
}`)
    })

    test('processes descriptors inside conditional expressions', () => {
      const input = `const msg = condition ? intl.formatMessage({defaultMessage: 'Yes', description: 'd1'}) : intl.formatMessage({defaultMessage: 'No', description: 'd2'})`
      expect(t(input)).toBe(
        `const msg = condition ? intl.formatMessage({id: "4dbqwv", defaultMessage: 'Yes',}) : intl.formatMessage({id: "g0IRkc", defaultMessage: 'No',})`
      )
    })

    test('processes deeply nested JSX', () => {
      const input = `<div><span><FormattedMessage defaultMessage="Hello" description="greeting" /></span></div>`
      expect(t(input)).toBe(
        `<div><span><FormattedMessage id="K+VETU" defaultMessage="Hello" /></span></div>`
      )
    })

    test('processes mixed call types in one file', () => {
      const input = `
const msg1 = intl.formatMessage({defaultMessage: 'Hello', description: 'd1'})
const msg2 = defineMessage({defaultMessage: 'World', description: 'd2'})
const msgs = defineMessages({
  a: {defaultMessage: 'A', description: 'd3'},
  b: {defaultMessage: 'B', description: 'd4'}
})
const el = <FormattedMessage defaultMessage="JSX" description="d5" />
const compiled = _jsx(FormattedMessage, {defaultMessage: 'Compiled', description: 'd6'})`
      expect(t(input)).toBe(`
const msg1 = intl.formatMessage({id: "nVcyBV", defaultMessage: 'Hello',})
const msg2 = defineMessage({id: "XeyjKd", defaultMessage: 'World',})
const msgs = defineMessages({
  a: {id: "b5o52y", defaultMessage: 'A',},
  b: {id: "ExuBU3", defaultMessage: 'B',}
})
const el = <FormattedMessage id="fLUJfK" defaultMessage="JSX" />
const compiled = _jsx(FormattedMessage, {id: "iWft3o", defaultMessage: 'Compiled',})`)
    })

    test('processes descriptors inside if/else blocks', () => {
      const input = `function foo() {
  if (condition) {
    return intl.formatMessage({defaultMessage: 'Yes', description: 'd1'})
  } else {
    return intl.formatMessage({defaultMessage: 'No', description: 'd2'})
  }
}`
      expect(t(input)).toBe(`function foo() {
  if (condition) {
    return intl.formatMessage({id: "4dbqwv", defaultMessage: 'Yes',})
  } else {
    return intl.formatMessage({id: "g0IRkc", defaultMessage: 'No',})
  }
}`)
    })

    test('processes descriptors inside array/object literals', () => {
      const input = `const arr = [
  intl.formatMessage({defaultMessage: 'First', description: 'd1'}),
  intl.formatMessage({defaultMessage: 'Second', description: 'd2'}),
]`
      expect(t(input)).toBe(`const arr = [
  intl.formatMessage({id: "4uLuio", defaultMessage: 'First',}),
  intl.formatMessage({id: "f2LszX", defaultMessage: 'Second',}),
]`)
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
      expect(t(input, {overrideIdFn: () => 'new-id'})).toBe(
        `intl.formatMessage({id: "new-id", defaultMessage: 'Hello'})`
      )
    })
  })
})

describe('@formatjs/unplugin factory', () => {
  // Helper to get the plugin object from the factory
  // The factory signature is (options, meta) per unplugin's UnpluginFactory type
  function getPlugin(factory: Function): any {
    return factory({}, {framework: 'vite'})
  }

  test('unpluginFactory returns correct plugin shape', async () => {
    const {unpluginFactory} = await import('../index.js')
    const plugin = getPlugin(unpluginFactory)
    expect(plugin.name).toBe('formatjs')
    expect(plugin.enforce).toBe('pre')
    expect(typeof plugin.transformInclude).toBe('function')
    expect(typeof plugin.transform).toBe('function')
  })

  test('transformInclude matches JS/TS files', async () => {
    const {unpluginFactory} = await import('../index.js')
    const plugin = getPlugin(unpluginFactory)
    expect(plugin.transformInclude('/src/App.tsx')).toBe(true)
    expect(plugin.transformInclude('/src/utils.ts')).toBe(true)
    expect(plugin.transformInclude('/src/main.js')).toBe(true)
    expect(plugin.transformInclude('/src/App.jsx')).toBe(true)
    expect(plugin.transformInclude('/src/styles.css')).toBe(false)
    expect(plugin.transformInclude('/node_modules/react/index.js')).toBe(false)
  })

  test('transform processes formatjs descriptors', async () => {
    const {unpluginFactory} = await import('../index.js')
    const plugin = getPlugin(unpluginFactory)
    const result = plugin.transform(
      `intl.formatMessage({defaultMessage: 'Hello', description: 'greeting'})`,
      '/src/App.tsx'
    )
    expect(result).toBeDefined()
    expect(result.code).toBe(
      `intl.formatMessage({id: "K+VETU", defaultMessage: 'Hello',})`
    )
  })

  test('transform returns undefined for non-formatjs code', async () => {
    const {unpluginFactory} = await import('../index.js')
    const plugin = getPlugin(unpluginFactory)
    const result = plugin.transform(
      `const x = 1; console.log(x);`,
      '/src/utils.ts'
    )
    expect(result).toBeUndefined()
  })
})
