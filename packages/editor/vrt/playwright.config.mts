import {defineConfig} from '@playwright/test'
import {fileURLToPath} from 'node:url'
import {visualConfig} from '@rules-web-e2e/vrt'

export default defineConfig(
  visualConfig({root: fileURLToPath(new URL('.', import.meta.url))})
)
