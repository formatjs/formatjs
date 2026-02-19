import {mkdtempSync} from 'fs'
import {join} from 'path'
import {tmpdir} from 'os'
import {build} from 'vite'
import formatjsPlugin from '@formatjs/vite-plugin'
import {describe, expect, test} from 'vitest'
import type {Options} from '@formatjs/vite-plugin'

async function buildFixture(
  fixture: string,
  pluginOptions: Options = {}
): Promise<string> {
  const outDir = mkdtempSync(join(tmpdir(), 'formatjs-vite-plugin-'))
  const result = await build({
    root: import.meta.dirname,
    mode: 'production',
    logLevel: 'silent',
    build: {
      write: false,
      lib: {
        entry: join(import.meta.dirname, 'fixtures', fixture),
        formats: ['es'],
      },
      rollupOptions: {
        external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      },
      minify: false,
      outDir,
    },
    plugins: [formatjsPlugin(pluginOptions)],
  })

  const output = Array.isArray(result) ? result[0] : result
  if ('output' in output) {
    const chunk = output.output.find(
      (o: any) => o.type === 'chunk' && o.isEntry
    ) as any
    // Sanitize sandbox-specific paths for stable snapshots
    return (chunk?.code ?? '').replace(
      /var _jsxFileName = "[^"]*"/g,
      'var _jsxFileName = "<source>"'
    )
  }
  throw new Error('Unexpected build result')
}

describe('@formatjs/vite-plugin integration', () => {
  test('formatMessage: generates ids and removes descriptions', async () => {
    const code = await buildFixture('formatMessage.ts')
    expect(code).toMatchSnapshot()
  })

  test('defineMessages: processes multiple descriptors', async () => {
    const code = await buildFixture('defineMessages.ts')
    expect(code).toMatchSnapshot()
  })

  test('JSX: generates ids and removes descriptions', async () => {
    const code = await buildFixture('jsx.tsx')
    expect(code).toMatchSnapshot()
  })

  test('defineMessage: processes single descriptor', async () => {
    const code = await buildFixture('defineMessage.ts')
    expect(code).toMatchSnapshot()
  })

  test('removeDefaultMessage option', async () => {
    const code = await buildFixture('formatMessage.ts', {
      removeDefaultMessage: true,
    })
    expect(code).toMatchSnapshot()
  })

  test('ast option pre-parses defaultMessage', async () => {
    const code = await buildFixture('defineMessage.ts', {ast: true})
    expect(code).toMatchSnapshot()
  })

  test('overrideIdFn option', async () => {
    const code = await buildFixture('formatMessage.ts', {
      overrideIdFn: (_id, defaultMessage, _description, _filePath) =>
        `custom_${defaultMessage?.replace(/\s+/g, '_')}`,
    })
    expect(code).toMatchSnapshot()
  })

  test('idInterpolationPattern option', async () => {
    const code = await buildFixture('formatMessage.ts', {
      idInterpolationPattern: '[sha512:contenthash:hex:8]',
    })
    expect(code).toMatchSnapshot()
  })
})
