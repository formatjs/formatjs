import {TranslationToolsDemo} from '../demo/tools-demo.js'
import {createRoot} from 'react-dom/client'
import {Editable, WorkflowFixture} from './editor.visual.js'
import {EditorTestShell} from './shell.js'

const params = new URLSearchParams(location.search)
const direction = params.has('rtl') ? 'rtl' : 'ltr'
createRoot(document.getElementById('editor-root')!).render(
  params.has('tools') ? (
    <TranslationToolsDemo />
  ) : params.has('workflow') ? (
    <EditorTestShell direction={direction}>
      <WorkflowFixture />
    </EditorTestShell>
  ) : (
    <Editable direction={direction} />
  )
)
