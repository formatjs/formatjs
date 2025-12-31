import vikeReact from 'vike-react/config'
import type {Config} from 'vike/types'

export default {
  extends: vikeReact,
  // SSR enabled - MUI has been replaced with shadcn/ui which supports SSR
  ssr: true,
} satisfies Config
