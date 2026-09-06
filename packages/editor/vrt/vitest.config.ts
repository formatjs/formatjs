import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineConfig, mergeConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'
import {playwright} from '@vitest/browser-playwright'
import {visualConfig} from '@rules-web-e2e/vrt'

const root = path.dirname(fileURLToPath(import.meta.url))
const nodeModules = path.join(root, 'node_modules')

export default mergeConfig(
  visualConfig({
    provider: playwright,
    root,
    viewport: {width: 1280, height: 720},
  }),
  defineConfig({
    plugins: [
      react(),
      {
        name: 'editor-source-imports',
        configureServer(server) {
          server.middlewares.use('/fixtures', (req, res, next) => {
            if (!['/en.json', '/ru.json'].includes(req.url ?? '')) return next()
            const messages = Object.fromEntries(
              Array.from({length: 53}, (_, index) => [
                `message-${index}`,
                [
                  'Welcome, {name}',
                  'You have {count, number} messages',
                  'Updated {date, date, short}',
                ][index % 3],
              ])
            )
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(messages))
          })
        },
        resolveId(id) {
          if (id.startsWith('#packages/editor/')) {
            return path.join(
              root,
              '..',
              id.slice('#packages/editor/'.length).replace(/\.js$/, '.tsx')
            )
          }
        },
      },
    ],
    resolve: {
      alias: [
        'react',
        'react-dom',
        'react-intl',
        '@material-ui/core',
        '@material-ui/icons',
        '@material-ui/lab',
        '@formatjs/icu-messageformat-parser',
      ].map(name => ({find: name, replacement: path.join(nodeModules, name)})),
      dedupe: ['react', 'react-dom'],
    },
    server: {fs: {allow: [path.resolve(root, '..'), nodeModules]}},
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@material-ui/core',
        '@material-ui/icons',
        '@material-ui/lab',
        'react-intl',
        '@formatjs/icu-messageformat-parser',
      ],
    },
    test: {include: ['editor.visual.test.tsx']},
  })
)
