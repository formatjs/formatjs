import {defineConfig} from '@playwright/test'
import {e2eConfig} from '@rules-web-e2e/vrt'
import {fileURLToPath} from 'node:url'

export default defineConfig(
  e2eConfig({root: fileURLToPath(new URL('.', import.meta.url))})
)
