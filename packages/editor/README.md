# @formatjs/editor

A React editor for browsing and updating ICU MessageFormat catalogs. It includes
search, locale/catalog/status filters, source context, ICU token previews, and
client-side validation that keeps arguments, tags, selectors, and exact plural
keys intact.

## Usage

Import the component and its default stylesheet, then provide source messages,
translations by locale, and a save callback:

```tsx
import Editor from '@formatjs/editor'
import '@formatjs/editor/styles.css'

const messages = [
  {
    id: 'greeting',
    defaultMessage: 'Hello, <strong>{name}</strong>!',
    description: 'Greeting shown after sign-in',
    catalogs: ['web'],
    locations: [{file: 'src/home.tsx', start: 12}],
    translations: {
      'fr-FR': 'Bonjour, <strong>{name}</strong> !',
    },
  },
]

export function TranslationApp() {
  return (
    <Editor
      messages={messages}
      locales={['fr-FR', 'ru']}
      defaultLocale="fr-FR"
      onSave={async update => {
        await saveTranslation(update)
      }}
    />
  )
}
```

`onSave` receives `{id, locale, translation}`. The editor waits for a returned
promise, reports failures, and marks the current draft as saved only after the
callback succeeds. Keep `messages` as the source of truth by updating its
translation after persistence succeeds.

The stylesheet uses `--formatjs-editor-*` custom properties so applications can
adapt the colors without replacing the component layout. `MessagePreview` and
`validateTranslation` are also exported for applications that need only the ICU
preview or validation behavior.
