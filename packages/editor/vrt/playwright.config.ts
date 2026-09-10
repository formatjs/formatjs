import {defineConfig, type PlaywrightTestConfig} from '@playwright/test'
import {fileURLToPath} from 'node:url'
import {visualConfig} from '@rules-web-e2e/vrt'

const config: PlaywrightTestConfig = defineConfig(
  visualConfig({root: fileURLToPath(new URL('.', import.meta.url))})
)
export default config
