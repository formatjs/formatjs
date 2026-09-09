import {useState, type ReactElement} from 'react'
import {TranslationEditorDemo} from '../workflow-demo.js'
import type {EditorMessage} from '../index.js'
import {createRoot} from 'react-dom/client'
import {EditorDemo} from '../demo.js'
import {EditorTestShell} from './shell.js'

createRoot(document.getElementById('editor-root')!).render(
  <EditorTestShell
    direction={new URLSearchParams(location.search).has('rtl') ? 'rtl' : 'ltr'}
  >
    {new URLSearchParams(location.search).has('workflow') ? (
      <WorkflowFixture />
    ) : (
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
    )}
  </EditorTestShell>
)

function WorkflowFixture(): ReactElement {
  const [messages, setMessages] = useState<EditorMessage[]>([
    {
      id: 'welcome',
      defaultMessage: 'Welcome, {name}',
      translations: {},
      catalogs: ['web'],
      description: 'Greeting shown after sign-in',
      locations: [{file: 'src/home.tsx', start: 12}],
    },
    {
      id: 'messages',
      defaultMessage: 'You have {count, number} messages',
      translations: {},
      catalogs: ['mobile'],
    },
    {
      id: 'updated',
      defaultMessage: 'Updated {date, date, short}',
      translations: {},
      catalogs: ['web'],
    },
  ])
  return (
    <TranslationEditorDemo
      messages={messages}
      locales={['fr', 'ru']}
      pageSize={2}
      onSave={async update => {
        setMessages(current =>
          current.map(message =>
            message.id === update.id
              ? {
                  ...message,
                  translations: {
                    ...message.translations,
                    [update.locale]: update.translation,
                  },
                }
              : message
          )
        )
      }}
    />
  )
}
