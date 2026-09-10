import {defineConfig, type PlaywrightTestConfig} from '@playwright/test'
import {fileURLToPath} from 'node:url'
import {visualConfig} from '@rules-web-e2e/vrt'

const defaults = visualConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
})
const config: PlaywrightTestConfig = defineConfig(defaults, {
  use: {baseURL: new URL('./gallery.html', defaults.use!.baseURL).href},
})
export default config
