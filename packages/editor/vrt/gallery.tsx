import {flushSync} from 'react-dom'
import {createRoot, type Root} from 'react-dom/client'
import {installVisualGallery} from '@rules-web-e2e/vrt/visual'
import visualModule from './editor.visual.js'

let root: Root | undefined
let renderError: unknown
installVisualGallery([visualModule], {
  render(node) {
    renderError = undefined
    root ??= createRoot(document.getElementById('root')!, {
      onUncaughtError(error) {
        renderError = error
      },
    })
    flushSync(() => root!.render(node))
    if (renderError) throw renderError
  },
  unmount() {
    root?.unmount()
    root = undefined
  },
})
