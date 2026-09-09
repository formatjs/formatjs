# Headless message editor

The React 19 editor exposes behavior without DOM, styles, a design system, an
IntlProvider, or network requests. Consumers own catalogs, persistence, loading
states, labels, layout, and providers. The native HTML view in `demo.tsx` is an
example consumer, not part of the headless entry point.

```tsx
import {useMessageEditor} from './index.js'

function TranslationEditor({messages, onMessageChange}) {
  const editor = useMessageEditor({messages, onMessageChange})
  return (
    <YourTextArea
      label="Translation"
      value={editor.selectedMessage?.translatedMessage ?? ''}
      onValueChange={editor.setTranslation}
      invalid={!!editor.translation?.error}
    />
  )
}
```

Use your design system's controls and localize their labels in the consumer.
`Editor` also accepts a render function as `children` with the same state.
Neither API adds elements or requires a provider.

- `messages` is controlled; `onMessageChange` receives the edited message.
  Apply it to the parent catalog by ID. Invalid ICU text is preserved for editing.
- `selectMessage`, `selectedMessage`, `query`, and `setQuery` control navigation.
  Search covers IDs, source text, translations, and descriptions. Filtering does
  not discard selection or edits. A missing selection falls back to the first
  catalog message; an empty catalog has no selection.
- `setTranslation`, `copySource`, and `clearTranslation` edit the selected message.
  Copy means copying source text into the translation, not the system clipboard.
- `source` and `translation` expose `{ast, error}` parse results. The AST retains
  all plural/select branches, rich-text tags, and skeletons. `Message` passes the
  same result to its render function; `parseMessage` is available without React.

Message IDs must be unique within a catalog. Remount the editor when switching
catalogs if selection and search should reset. Persistence and validation policy
(such as forbidding saves with ICU errors) belong to the consumer.

This replaces the WIP Material UI app entry point. Import `Editor` or
`useMessageEditor`; mount `EditorDemo` explicitly for the example view. Standalone
entry points use React's `createRoot`. No Material UI dependency remains.

Run `bazel test //packages/editor:unit_test` for state and renderer coverage.
See [visual tests](vrt/README.md) for browser coverage and baseline updates.
