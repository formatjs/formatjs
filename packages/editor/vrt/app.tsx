import {createRoot} from 'react-dom/client'
import {EditorDemo} from '../demo.js'
import {EditorTestShell} from './shell.js'

createRoot(document.getElementById('editor-root')!).render(
  <EditorTestShell
    direction={new URLSearchParams(location.search).has('rtl') ? 'rtl' : 'ltr'}
  >
    <EditorDemo
      initialMessages={[
        {
          id: 'welcome',
          defaultMessage: 'Welcome, {name}',
          translatedMessage: '',
        },
        {
          id: 'messages',
          defaultMessage: 'You have {count, number} messages',
          translatedMessage: '',
        },
        {
          id: 'updated',
          defaultMessage: 'Updated {date, date, short}',
          translatedMessage: '',
        },
      ]}
    />
  </EditorTestShell>
)
