import {createRequire} from 'node:module'
import path from 'node:path'
import {defineConfig, type PlaywrightTestConfig} from '@playwright/test'

const require = createRequire(import.meta.url)
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`
const baseURL = 'http://127.0.0.1:4173'

const config: PlaywrightTestConfig = defineConfig({
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: {width: 1280, height: 720},
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: [
      process.execPath,
      require.resolve('http-server/bin/http-server'),
      path.join(import.meta.dirname, 'assets'),
      '-a',
      '127.0.0.1',
      '-p',
      '4173',
      '-c-1',
    ]
      .map(quote)
      .join(' '),
    url: baseURL,
    reuseExistingServer: false,
  },
})

export default config
