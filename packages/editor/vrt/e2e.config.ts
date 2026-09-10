import {defineConfig, type PlaywrightTestConfig} from '@playwright/test'
import {e2eConfig} from '@rules-web-e2e/vrt'
import {fileURLToPath} from 'node:url'

const config: PlaywrightTestConfig = defineConfig(
  e2eConfig({root: fileURLToPath(new URL('.', import.meta.url))})
)

export default config
