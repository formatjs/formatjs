import {flushSync} from 'react-dom'
import {createRoot, type Root} from 'react-dom/client'
import {Editable} from './editor.visual.js'

declare global {
  interface Window {
    mount(params: {story: string; props?: {direction?: 'ltr' | 'rtl'}}): void
    unmount(): void
  }
}

let root: Root | undefined
let renderError: unknown
window.mount = ({story, props}) => {
  if (story !== 'Editor/Editable') throw new Error(`Unknown story: ${story}`)
  renderError = undefined
  root ??= createRoot(document.getElementById('root')!, {
    onUncaughtError(error) {
      renderError = error
    },
  })
  flushSync(() => root!.render(<Editable {...props} />))
  if (renderError) throw renderError
}
window.unmount = () => {
  root?.unmount()
  root = undefined
}
