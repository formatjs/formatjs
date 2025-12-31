import vikeReact from 'vike-react/config'
import type {Config} from 'vike/types'

const config: Config = {
  extends: vikeReact,
  // Enable SSR for prerendering to generate full HTML
  // At runtime, we only serve static files (no server needed)
  prerender: true,
}

export default config
