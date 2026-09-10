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

### Multiple locale views

Mount one workflow above your locale views. `getTranslation(id, locale)` exposes
the value, baseline, validation, save feedback, and actions for that pair, sharing
the same draft store as the selected-message API:

```tsx
const draft = workflow.getTranslation(messageId, locale)
if (!draft) return null
return (
  <YourTextArea
    value={draft.value}
    onValueChange={draft.setTranslation}
    invalid={!!draft.validationError}
  />
)
```

Each view can call `draft.reset()` and `draft.save()` independently. Hiding or
unmounting a view preserves its draft while the owning workflow remains mounted.
Keep available locales in the workflow's `locales` option; choose which views
to display in your UI. The getter returns `undefined` for IDs or locales absent
from the current options. Drafts survive their temporary removal, including saves
that complete while a message is outside a loaded page.

### Save results and context

`save(context?)` resolves to a discriminated result. Successful persistence returns
`{status: 'saved', value}` with the value returned by `onSave`. Failures return
`{status: 'failed', error}` and also populate `saveError`. Validation failures return
`{status: 'invalid', validationError}`. Saves that do not call persistence return
`{status: 'skipped', reason}`, where the reason is `unavailable`, `unchanged`, or
`pending`. The pending guard is scoped to a message/locale pair, so different pairs
can save concurrently.

The optional caller context and persistence result are generic types:

```tsx
type SaveContext = {intent: 'save' | 'review'}
type Receipt = {revision: string}

const workflow = useTranslationEditor<SaveContext, Receipt>({
  messages,
  locales,
  onSave: async (update, snapshot) => {
    return persist(update, {
      intent: snapshot.context?.intent ?? 'save',
      previousTranslation: snapshot.baselineTranslation,
      source: snapshot.source,
    })
  },
})

const result = await workflow.save({intent: 'review'})
if (result.status === 'saved') showReceipt(result.value.revision)
```

`onSave` receives the submitted translation and a frozen metadata object containing
the source, baseline translation, and context. Draft state and its `save` action
are render snapshots: retaining an action for a confirmation dialog retains that
translation, source, and baseline even if selection or edits subsequently change.
Context is passed by reference, not cloned; pass immutable context values.
Persistence policy, confirmation UI, and receipt presentation remain with the
consumer.

Existing one-argument `onSave` callbacks and callers that await or ignore `save()`
continue to work. Callers that explicitly annotate `save()` as `Promise<void>`
must change that annotation to `Promise<TranslationSaveResult>` (with their result
type parameter, if needed).

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

## Browser interaction tests

Write native Playwright `*.spec.ts` files in `packages/editor/vrt/`. The
`e2eConfig` helper supplies `baseURL`, so specs can use `page.goto('/')`,
accessible locators, clicks, and web-first assertions. VRT captures are generated from the `.visual.tsx` module. Both targets share the consumer-owned
server, shell, declared inputs, and pinned Testcontainers browser.

```sh
bazel test //packages/editor/vrt:e2e_test --test_output=errors
bazel test //packages/editor/vrt:e2e_test --test_arg=--grep=translation
```

E2E covers editing, search, selection, copy/clear, ICU error recovery, locale
drafts, and saving. It requires Docker and runs manually, locally, and uncached.
CI should explicitly select both `e2e_test` and `visual_test`. Failures retain
JUnit, screenshots, and Playwright traces in undeclared test outputs.

## Component browser tests

`bazel test //packages/editor/vrt:component_test --test_output=errors` runs
Playwright 1.63 native `mount()` specs for the real editor. The typed
`editor.visual.tsx` uses the existing provider shell and demo; `gallery.tsx` owns
mount/update/unmount. The tests check provider updates without losing a draft,
clear, ICU validation, and isolation between mounts.

`component_browser_test` shares the custom server, root npm dependencies, strict
typechecks, and pinned Testcontainers browser with E2E and VRT.
`componentBrowserConfig` discovers `*.browser.spec.ts` separately from the E2E
`*.spec.ts` and generated VRT capture cases. CI should explicitly run all three
manual browser targets. Screenshot baselines and updates remain in `visual_test`.

The default export of `editor.visual.tsx` is a `ComponentVisualModule`: it declares
renderable cases, browser-side capture hooks, and VRT options. The gallery registers
that module with `installVisualGallery`. The shared runtime generates all six
screenshot tests; no `editor.visual.spec.ts` is maintained. Interaction tests stay
in `editor.browser.spec.tsx`, and the existing PNG names remain explicit in the
visual declarations.
