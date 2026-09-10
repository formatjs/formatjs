import {useState} from 'react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {useTranslationEditor} from '#packages/editor/index.js'
import {
  MessageList,
  EditorDesignSystemProvider,
  useEditorDesignSystem,
  TranslationEditorView,
  TranslationField,
  type EditorComponents,
} from '#packages/editor/ui.js'

const SOURCE = 'Hello {name}'
const FRENCH = 'Bonjour {name}'
const GERMAN = 'Hallo {name}'
const EDIT = 'Salut {name}'
const INVALID = 'Missing placeholder'
const VALIDATION = 'Keep the name argument.'
const messages = [
  {
    id: 'greeting',
    defaultMessage: SOURCE,
    translations: {fr: FRENCH, de: GERMAN},
  },
]
const locales = ['fr', 'de']
afterEach(cleanup)

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(yes => {
    resolve = yes
  })
  return {promise, resolve}
}

/** A second control API maps value callbacks and press actions at the adapter. */
const customComponents: Partial<EditorComponents> = {
  TextArea: ({onValueChange, ...props}) => (
    <textarea
      {...props}
      title="Custom field"
      onChange={event => onValueChange(event.target.value)}
    />
  ),
  Button: ({onPress, children, disabled}) => (
    <button
      type="button"
      title="Custom action"
      disabled={disabled}
      onClick={() => onPress()}
    >
      {children}
    </button>
  ),
  Layout: ({toolbar, navigation, content}) => (
    <article aria-label="Custom workspace">
      <header>{toolbar}</header>
      <aside>{navigation}</aside>
      <main>{content}</main>
    </article>
  ),
}

describe('public editor view', () => {
  it('wires locale validation, pending saves, newer edits, and reset to the shared workflow', async () => {
    const request = deferred()
    const persist = vi.fn(() => request.promise)
    function Example() {
      const workflow = useTranslationEditor({
        messages,
        locales,
        onSave: persist,
      })
      return (
        <TranslationEditorView
          messages={messages}
          selectedMessage={messages[0]}
          onSelect={() => {}}
          translations={locales.map(locale => {
            const draft = workflow.getTranslation('greeting', locale)!
            return {
              locale,
              draft,
              onSave: () => {
                void draft.save()
              },
            }
          })}
          labels={{validation: {structure: VALIDATION}}}
        />
      )
    }
    render(<Example />)
    const french = within(screen.getByRole('region', {name: 'fr'}))
    const german = within(screen.getByRole('region', {name: 'de'}))
    const field = french.getByRole('textbox') as HTMLTextAreaElement
    expect(
      french.getByRole<HTMLButtonElement>('button', {name: 'Save translation'})
        .disabled
    ).toBe(true)
    fireEvent.change(field, {target: {value: INVALID}})
    expect(field.getAttribute('aria-invalid')).toBe('true')
    expect(
      document.getElementById(
        field.getAttribute('aria-describedby')!.split(' ')[0]!
      )?.textContent
    ).toBe(VALIDATION)
    fireEvent.click(french.getByRole('button', {name: 'Save translation'}))
    expect(persist).not.toHaveBeenCalled()
    fireEvent.change(field, {target: {value: EDIT}})
    fireEvent.click(french.getByRole('button', {name: 'Save translation'}))
    expect(persist).toHaveBeenCalledExactlyOnceWith(
      {id: 'greeting', locale: 'fr', translation: EDIT},
      {source: SOURCE, baselineTranslation: FRENCH, context: undefined}
    )
    expect(
      french.getByRole<HTMLButtonElement>('button', {name: 'Saving…'}).disabled
    ).toBe(true)
    fireEvent.change(field, {target: {value: EDIT + '!'}})
    await act(async () => request.resolve())
    expect(field.value).toBe(EDIT + '!')
    fireEvent.click(french.getByRole('button', {name: 'Reset'}))
    expect(field.value).toBe(EDIT)
    expect((german.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
      GERMAN
    )
  })

  it('supports custom controls and layout without remounting the field on edits', () => {
    const save = vi.fn()
    function Example() {
      const workflow = useTranslationEditor({
        messages,
        locales,
        onSave: () => {},
      })
      const [visible, setVisible] = useState(true)
      const draft = workflow.getTranslation('greeting', 'fr')!
      return (
        <>
          <button type="button" onClick={() => setVisible(value => !value)}>
            Toggle locale
          </button>
          <EditorDesignSystemProvider components={customComponents}>
            <TranslationEditorView
              filters={<h1>Workspace</h1>}
              messages={messages}
              selectedMessage={messages[0]}
              onSelect={() => {}}
              translations={
                visible ? [{locale: 'fr', draft, onSave: save}] : []
              }
            />
          </EditorDesignSystemProvider>
        </>
      )
    }
    render(<Example />)
    const field = screen.getByTitle('Custom field') as HTMLTextAreaElement
    field.focus()
    fireEvent.change(field, {target: {value: EDIT}})
    expect(document.activeElement).toBe(field)
    fireEvent.click(screen.getByRole('button', {name: 'Save translation'}))
    expect(save).toHaveBeenCalledExactlyOnceWith()
    expect(
      within(screen.getByRole('article', {name: 'Custom workspace'})).getByRole(
        'heading',
        {name: 'Workspace'}
      )
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', {name: 'Toggle locale'}))
    expect(screen.queryByLabelText('fr')).toBeNull()
    fireEvent.click(screen.getByRole('button', {name: 'Toggle locale'}))
    expect(
      (screen.getByRole('textbox', {name: 'fr'}) as HTMLTextAreaElement).value
    ).toBe(EDIT)
  })

  it('resolves components through context with nested overrides and isolated siblings', () => {
    const pressed = vi.fn()
    const changed = vi.fn()
    const nested: Partial<EditorComponents> = {
      Button: ({onPress, children, disabled}) => (
        <button
          type="button"
          title="Nested action"
          disabled={disabled}
          onClick={() => onPress()}
        >
          {children}
        </button>
      ),
    }
    function Controls({name}: {name: string}) {
      const {Button, TextArea} = useEditorDesignSystem()
      const [value, setValue] = useState('')
      return (
        <section aria-label={name}>
          <label htmlFor={name}>{name}</label>
          <TextArea
            id={name}
            value={value}
            rows={3}
            onValueChange={next => {
              setValue(next)
              changed(next)
            }}
          />
          <Button variant="primary" onPress={pressed}>
            Apply
          </Button>
        </section>
      )
    }
    function Example({override}: {override: Partial<EditorComponents>}) {
      return (
        <>
          <EditorDesignSystemProvider components={customComponents}>
            <Controls name="outer" />
            <EditorDesignSystemProvider components={override}>
              <Controls name="nested" />
            </EditorDesignSystemProvider>
          </EditorDesignSystemProvider>
          <EditorDesignSystemProvider components={nested}>
            <Controls name="sibling" />
          </EditorDesignSystemProvider>
          <Controls name="native" />
        </>
      )
    }
    const {rerender} = render(<Example override={nested} />)
    const outer = within(screen.getByRole('region', {name: 'outer'}))
    const inner = within(screen.getByRole('region', {name: 'nested'}))
    const sibling = within(screen.getByRole('region', {name: 'sibling'}))
    const native = within(screen.getByRole('region', {name: 'native'}))
    expect(outer.getByRole('button').title).toBe('Custom action')
    expect(inner.getByRole('button').title).toBe('Nested action')
    expect(sibling.getByRole('button').title).toBe('Nested action')
    expect(native.getByRole('button').title).toBe('')
    const field = inner.getByRole('textbox') as HTMLTextAreaElement
    expect(field.title).toBe('Custom field')
    expect(sibling.getByRole('textbox').title).toBe('')
    expect(field.getAttribute('rows')).toBe('3')
    field.focus()
    fireEvent.change(field, {target: {value: EDIT}})
    expect(changed).toHaveBeenCalledExactlyOnceWith(EDIT)
    fireEvent.click(inner.getByRole('button'))
    expect(pressed).toHaveBeenCalledExactlyOnceWith()
    rerender(<Example override={{}} />)
    expect(inner.getByRole('button').title).toBe('Custom action')
    expect(inner.getByRole('textbox')).toBe(field)
    expect(field.value).toBe(EDIT)
    expect(document.activeElement).toBe(field)
    expect(sibling.getByRole('button').title).toBe('Nested action')
  })

  it('leaves search, selection, pagination, and off-page detail under caller control', () => {
    const search = vi.fn()
    const select = vi.fn()
    const page = [{id: 'other', defaultMessage: 'Another message'}]
    const props = {
      messages: page,
      selectedMessage: messages[0],
      translations: [],
      onSelect: select,
      search: {value: 'server query', onValueChange: search},
      pagination: <button type="button">Next page</button>,
      context: <p>Source context</p>,
    }
    const {rerender} = render(<TranslationEditorView {...props} loading />)
    const input = screen.getByRole('searchbox') as HTMLInputElement
    fireEvent.change(input, {target: {value: 'new query'}})
    expect(search).toHaveBeenCalledExactlyOnceWith('new query')
    expect(screen.getByRole('navigation').getAttribute('aria-busy')).toBe(
      'true'
    )
    fireEvent.click(screen.getByRole('button', {name: /Another message/}))
    expect(select).toHaveBeenCalledExactlyOnceWith('other')
    expect(screen.getByText(SOURCE)).toBeTruthy()
    expect(screen.getByText('Source context')).toBeTruthy()
    expect(screen.getByRole('button', {name: 'Next page'})).toBeTruthy()
    rerender(<TranslationEditorView {...props} messages={[]} />)
    expect(screen.getByText('No matching messages')).toBeTruthy()
    expect(screen.getByText(SOURCE)).toBeTruthy()
  })

  it('keeps action slots and errors accessible without submitting a surrounding form', () => {
    const submit = vi.fn(event => event.preventDefault())
    const reset = vi.fn()
    const setTranslation = vi.fn()
    const save = vi.fn()
    const error = new Error('Persistence unavailable')
    const draft = {
      value: EDIT,
      validationError: null,
      changed: true,
      isSaving: false,
      saveError: error,
      saved: false,
      reset,
      setTranslation,
    }
    const {rerender} = render(
      <form onSubmit={submit}>
        <TranslationField
          locale="fr"
          source={SOURCE}
          draft={draft}
          onSave={save}
        />
      </form>
    )
    fireEvent.click(screen.getByRole('button', {name: 'Copy source'}))
    expect(setTranslation).toHaveBeenCalledExactlyOnceWith(SOURCE)
    fireEvent.click(screen.getByRole('button', {name: 'Save translation'}))
    expect(save).toHaveBeenCalledExactlyOnceWith()
    expect(submit).not.toHaveBeenCalled()
    const errorId = screen
      .getByRole('textbox')
      .getAttribute('aria-describedby')!
      .split(' ')[0]!
    expect(document.getElementById(errorId)).toBe(screen.getByRole('alert'))
    expect(screen.getByRole('alert').textContent).toBe(error.message)
    rerender(
      <>
        <TranslationField
          locale="fr"
          source={SOURCE}
          draft={draft}
          actions={null}
        />
        <TranslationField
          locale="fr"
          source={SOURCE}
          draft={draft}
          actions={<button type="button">Review</button>}
        />
      </>
    )
    expect(screen.queryByRole('button', {name: 'Save translation'})).toBeNull()
    expect(screen.getByRole('button', {name: 'Review'})).toBeTruthy()
    expect(
      new Set(screen.getAllByRole('textbox').map(field => field.id)).size
    ).toBe(2)
  })

  it('renders an empty controlled list without requesting selection', () => {
    const onSelect = vi.fn()
    render(
      <MessageList
        messages={[]}
        onSelect={onSelect}
        labels={{noMessages: 'Nothing here'}}
      />
    )
    expect(screen.getByRole('status').textContent).toBe('Nothing here')
    expect(onSelect).not.toHaveBeenCalled()
  })
})
