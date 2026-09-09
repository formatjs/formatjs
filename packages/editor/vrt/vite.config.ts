import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineConfig, type UserConfig} from 'vite'
import react from '@vitejs/plugin-react'
import stylex from '@stylexjs/unplugin'

const root = path.dirname(fileURLToPath(import.meta.url))
const workspace = path.resolve(root, '../../..')
const nodeModules = path.join(workspace, 'node_modules')

const config: UserConfig = defineConfig({
  root,
  cacheDir: process.env.VRT_CACHE,
  plugins: [
    stylex.vite({
      useCSSLayers: true,
      dev: true,
      unstable_moduleResolution: {type: 'commonJS', rootDir: workspace},
    }),
    react(),
  ],
  resolve: {
    alias: [
      '@stylexjs/stylex',
      'react',
      'react-dom',
      'react-intl',
      '@formatjs/editor',
    ].map(name => ({find: name, replacement: path.join(nodeModules, name)})),
    dedupe: ['react', 'react-dom'],
  },
  server: {fs: {allow: [workspace]}},
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'react-intl',
      '@formatjs/editor',
    ],
  },
})

export default config
