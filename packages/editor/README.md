# Headless message editor

Install `@formatjs/editor` alongside React 19. The published package exports
headless APIs and TypeScript declarations; demo UI remains repository-only.

The React 19 editor exposes behavior without DOM, styles, a design system, an
IntlProvider, or network requests. Consumers own catalogs, persistence, loading
states, labels, layout, and providers. The StyleX view in `demo/demo.tsx` is an
example consumer, not part of the headless entry point.

The optional `demo/design-system/` layer provides tokens and native button, input,
textarea, badge, and panel components. Customize `tokens.stylex.ts` or supply a
StyleX theme. The demo adds responsive layout, keyboard focus, validation states,
and logical spacing for RTL. Its Vite setup uses `@stylexjs/unplugin`; consumers
using another design system need neither StyleX nor these components.

```tsx
import {useMessageEditor} from '@formatjs/editor'

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

## Translation workflow

`useTranslationEditor` layers draft storage and persistence on `useMessageEditor`.
The existing `Editor`, `Message`, and `useMessageEditor` APIs stay unchanged.
It adds no DOM, styling, provider, or network dependency.

```tsx
const workflow = useTranslationEditor({
  messages, // {id, defaultMessage, description?, catalogs?, locations?, translations}
  locales: ['fr', 'ru'],
  defaultLocale: 'fr',
  pageSize: 100,
  onSave: async update => {
    await persist(update) // {id, locale, translation}
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
  },
})
```

Use `workflow.editor` for editing/search/selection, `pageMessages` for the current
page, and `setLocale`, `setCatalog`, `setStatus`, and `setPage` for navigation.
`selectedMessage` exposes catalog and source-location context. Status filters
reflect saved translations, so typing does not move a message out of the list.
Locales may load asynchronously; an absent selection falls back to the first
available locale. Pagination clamps when messages or page size change.

Drafts, reset baselines, errors, and pending saves are scoped by message ID and
locale. Switching messages, filters, or locales retains drafts. `save()` validates
the selected draft, ignores duplicate submissions for that key, and reports
failure through `saveError`. A completed save updates only its submitted key;
newer edits remain dirty. Update controlled messages after persistence succeeds.
Clean drafts adopt external changes; dirty drafts retain their text. `reset()`
restores the latest saved baseline. Remount when switching unrelated catalogs
that reuse message IDs, or when intentionally discarding all drafts.

`validateTranslation(source, translation)` returns `null` or a localizable error
code: `empty`, `invalid-source`, `invalid-translation`, or `structure`. It checks
arguments, tag nesting, formatting styles, select branches, plural type/offset,
and exact selectors. Locale-specific plural categories are allowed; new
categories inherit the source `other` branch's argument contract. Repeated
placeholders do not change that contract. Validation is structural, not a check
of translation quality.

The optional `TranslationEditorDemo` in `demo/workflow-demo.tsx` reuses the StyleX
`EditorView`, tokens, and controls. It includes locale/catalog/status filters,
pagination, source locations, localized validation, reset, and save feedback.
Supply an `IntlProvider` and the same StyleX Vite integration used by the demo.
It is separate from the headless entry point; consumers can use any design system.
