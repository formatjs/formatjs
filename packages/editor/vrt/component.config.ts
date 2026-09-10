import {defineConfig, type PlaywrightTestConfig} from '@playwright/test'
import {componentBrowserConfig} from '@rules-web-e2e/vrt'
import {fileURLToPath} from 'node:url'

const config: PlaywrightTestConfig = defineConfig(
  componentBrowserConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    gallery: './gallery.html',
  })
)
export default config
