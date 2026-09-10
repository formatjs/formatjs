import {useState} from 'react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'
import {
  Editor,
  Message,
  parseMessage,
  useMessageEditor,
  type TranslatedMessage,
} from './index.js'

const messages: TranslatedMessage[] = [
  {
    id: 'greeting',
    defaultMessage: 'Hello {name}',
    translatedMessage: 'Bonjour {name}',
  },
  {
    id: 'count',
    defaultMessage: '{count, plural, one {One} other {# items}}',
    translatedMessage: '',
    description: 'Cart total',
  },
]

afterEach(cleanup)

describe('headless editor', () => {
  it('supports controlled edits, selection, copy, clear, and search without losing edits', () => {
    const {result} = renderHook(() => {
      const [value, setValue] = useState(messages)
      return useMessageEditor({
        messages: value,
        onMessageChange: updated =>
          setValue(current =>
            current.map(message =>
              message.id === updated.id ? updated : message
            )
          ),
      })
    })
    act(() => result.current.setTranslation('Salut {name}'))
    act(() => result.current.selectMessage('count'))
    act(() => result.current.copySource())
    expect(result.current.selectedMessage?.translatedMessage).toBe(
      messages[1].defaultMessage
    )
    act(() => result.current.setQuery('CART'))
    expect(result.current.messages.map(message => message.id)).toEqual([
      'count',
    ])
    act(() => result.current.selectMessage('greeting'))
    expect(result.current.selectedMessage?.translatedMessage).toBe(
      'Salut {name}'
    )
    act(() => result.current.clearTranslation())
    expect(result.current.selectedMessage?.translatedMessage).toBe('')
  })

  it('tracks parent updates and handles removed selections and empty catalogs', () => {
    const {result, rerender} = renderHook(
      ({value}) =>
        useMessageEditor({
          messages: value,
          defaultSelectedId: 'count',
          onMessageChange: () => {},
        }),
      {initialProps: {value: messages}}
    )
    expect(result.current.selectedMessage?.id).toBe('count')
    rerender({value: [messages[0]]})
    expect(result.current.selectedMessage?.id).toBe('greeting')
    rerender({value: []})
    expect(result.current.selectedMessage).toBeUndefined()
    expect(result.current.source).toBeUndefined()
    act(() => {
      result.current.copySource()
      result.current.clearTranslation()
    })
  })

  it('reports incomplete ICU edits without throwing or dropping text', () => {
    const {result} = renderHook(() =>
      useMessageEditor({
        messages: [{...messages[0], translatedMessage: '{name'}],
        onMessageChange: () => {},
      })
    )
    expect(result.current.selectedMessage?.translatedMessage).toBe('{name')
    expect(result.current.translation?.error).toBeInstanceOf(Error)
    expect(result.current.source?.error).toBeNull()
  })

  it('lets consumer components own all markup without a provider', () => {
    function CustomField({
      value,
      onValueChange,
    }: {
      value: string
      onValueChange: (value: string) => void
    }) {
      return (
        <input
          aria-label="Custom translation"
          value={value}
          onChange={event => onValueChange(event.target.value)}
        />
      )
    }
    function Consumer() {
      const [value, setValue] = useState([messages[0]])
      return (
        <Editor
          messages={value}
          onMessageChange={message => setValue([message])}
        >
          {editor => (
            <CustomField
              value={editor.selectedMessage!.translatedMessage}
              onValueChange={editor.setTranslation}
            />
          )}
        </Editor>
      )
    }
    const {container} = render(<Consumer />)
    expect(container.children).toHaveLength(1)
    expect(container.firstElementChild?.tagName).toBe('INPUT')
    fireEvent.change(screen.getByLabelText('Custom translation'), {
      target: {value: 'Hola {name}'},
    })
    expect(
      (screen.getByLabelText('Custom translation') as HTMLInputElement).value
    ).toBe('Hola {name}')
  })
})

it('exposes every ICU branch, rich-text tag, and number skeleton to renderers', () => {
  const text =
    '{count, plural, one {<b>One</b>} other {{count, number, ::currency/USD}}}'
  const parsed = parseMessage(text)
  expect(parsed.error).toBeNull()
  expect(JSON.stringify(parsed.ast)).toContain('currency')
  expect(JSON.stringify(parsed.ast)).toContain('one')
  expect(JSON.stringify(parsed.ast)).toContain('other')
  render(
    <Message message={text}>
      {value => (
        <output>{value.error ? 'error' : JSON.stringify(value.ast)}</output>
      )}
    </Message>
  )
  expect(screen.getByRole('status').textContent).toContain('currency')
})
