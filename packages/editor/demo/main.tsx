import {createRoot} from 'react-dom/client'
import {IntlProvider} from 'react-intl'
import {EditorDemo} from './demo.js'
import en from './fixtures/en.json'
import ru from './fixtures/ru.json'

const translations: Record<string, string> = ru
const messages = Object.entries(en)
  .slice(0, 50)
  .map(([id, defaultMessage]) => ({
    id,
    defaultMessage,
    translatedMessage: translations[id] ?? '',
  }))
createRoot(document.getElementById('main')!).render(
  <IntlProvider locale="en">
    <EditorDemo initialMessages={messages} />
  </IntlProvider>
)
