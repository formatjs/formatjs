import path from 'node:path'
import fs from 'node:fs'
import {defineConfig, type UserConfig} from 'vite'
import react from '@vitejs/plugin-react'
import stylex from '@stylexjs/unplugin'

// Bazel runs the build in this package inside its output tree.
const root = process.cwd()
const workspace = path.resolve(root, '../../..')
const nodeModules = path.join(workspace, 'node_modules')

const config: UserConfig = defineConfig({
  root,
  envDir: false,
  css: {postcss: {}},
  build: {
    outDir: 'assets',
    minify: false,
    rolldownOptions: {
      input: [path.join(root, 'index.html'), path.join(root, 'gallery.html')],
    },
  },
  plugins: [
    stylex.vite({
      useCSSLayers: true,
      dev: true,
      unstable_moduleResolution: {type: 'commonJS', rootDir: workspace},
    }),
    react(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: [
      ...[
        '@stylexjs/stylex',
        'react',
        'react-dom',
        'react-intl',
        'intl-messageformat',
        '@formatjs/editor',
      ].map(name => ({
        find: name,
        replacement: fs.realpathSync(path.join(nodeModules, name)),
      })),
      {
        find: /^@formatjs\//,
        replacement: path.join(nodeModules, '@formatjs') + '/',
      },
    ],
    dedupe: ['react', 'react-dom'],
  },

})

export default config
