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
import {
  CopyTextButton,
  EditorDesignSystemProvider,
  LocalePicker,
  MessageContext,
  MessagePreview,
  type EditorComponents,
} from '#packages/editor/ui.js'

const RAW = 'Hello\n  {name}'
const NEXT = 'Bonjour\n {name}'
const COPY_ERROR = new Error('Clipboard denied')
const LOCALES = ['fr', 'de', 'ja', 'ar', 'es']
const COMPLEX =
  '{count, plural, offset:1 =0 {None} one {<b># item</b>} other {{gender, select, female {Her} other {Their}} # items}} {rank, selectordinal, one {#st} other {#th}} {price, number, ::currency/USD} {when, date, ::yyyyMMdd} {when, time, short}'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
function request() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => {
    resolve = yes
    reject = no
  })
  return {promise, resolve, reject}
}

describe('locale picker', () => {
  it('normalizes available selection and preserves order across toggles, select-all, and clear', () => {
    const change = vi.fn()
    function Example() {
      const [selected, setSelected] = useState(['fr', 'stale', 'fr'])
      return (
        <LocalePicker
          locales={[...LOCALES, 'fr']}
          selectedLocales={selected}
          onChange={next => {
            change(next)
            setSelected(next)
          }}
        />
      )
    }
    render(<Example />)
    fireEvent.click(screen.getByRole('button', {name: 'Locales: fr'}))
    const all = screen.getByRole('checkbox', {
      name: 'Select all 5 locales',
    }) as HTMLInputElement
    expect(all.indeterminate).toBe(true)
    expect(
      screen
        .getAllByRole('checkbox')
        .slice(1)
        .map(input => input.parentElement!.textContent)
    ).toEqual(LOCALES)
    fireEvent.click(screen.getByRole('checkbox', {name: 'de'}))
    expect(change).toHaveBeenLastCalledWith(['fr', 'de'])
    fireEvent.click(all)
    expect(change).toHaveBeenLastCalledWith(LOCALES)
    expect(all.checked).toBe(true)
    expect(all.indeterminate).toBe(false)
    fireEvent.click(all)
    expect(change).toHaveBeenLastCalledWith([])
    fireEvent.click(screen.getByRole('checkbox', {name: 'ja'}))
    fireEvent.click(screen.getByRole('button', {name: 'Clear'}))
    expect(change).toHaveBeenLastCalledWith([])
    expect(
      (screen.getByRole('button', {name: 'Clear'}) as HTMLButtonElement)
        .disabled
    ).toBe(true)
  })

  it('keeps sibling picker labels unique and selections controlled when available locales change', () => {
    const change = vi.fn()
    const picker = (locales: readonly string[]) => (
      <LocalePicker
        locales={locales}
        selectedLocales={['fr']}
        onChange={change}
        getLocaleLabel={locale => `Language ${locale}`}
      />
    )
    const {rerender} = render(
      <>
        {picker(['fr', 'de'])}
        {picker([])}
      </>
    )
    for (const button of screen.getAllByRole('button', {name: /Locales:/}))
      fireEvent.click(button)
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(new Set(checkboxes.map(input => input.id)).size).toBe(
      checkboxes.length
    )
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Select all 0 locales',
        }) as HTMLInputElement
      ).disabled
    ).toBe(true)
    fireEvent.click(screen.getByRole('checkbox', {name: 'Language de'}))
    expect(change).toHaveBeenCalledExactlyOnceWith(['fr', 'de'])
    expect(
      (screen.getByRole('checkbox', {name: 'Language de'}) as HTMLInputElement)
        .checked
    ).toBe(false)
    rerender(
      <>
        {picker(['de'])}
        {picker([])}
      </>
    )
    expect(screen.queryByRole('checkbox', {name: 'Language fr'})).toBeNull()
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Select all 1 locale',
        }) as HTMLInputElement
      ).indeterminate
    ).toBe(false)
  })
})

describe('clipboard control', () => {
  it('copies exact text once while pending, announces success, and expires feedback', async () => {
    vi.useFakeTimers()
    const pending = request()
    const writeText = vi.fn(() => pending.promise)
    const onCopy = vi.fn()
    const submit = vi.fn(event => event.preventDefault())
    render(
      <form onSubmit={submit}>
        <CopyTextButton
          value={RAW}
          label="source"
          writeText={writeText}
          onCopy={onCopy}
          feedbackDurationMs={100}
        />
      </form>
    )
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(writeText).toHaveBeenCalledExactlyOnceWith(RAW)
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(
      true
    )
    expect(screen.queryByRole('status')).toBeNull()
    await act(async () => pending.resolve())
    expect(onCopy).toHaveBeenCalledExactlyOnceWith(RAW)
    expect(screen.getByRole('status').textContent).toBe('Copied source')
    expect(submit).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(100))
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button', {name: 'Copy source'})).toBeTruthy()
  })

  it('announces rejected writes, permits retry, and ignores stale completions and unmounted callbacks', async () => {
    const old = request()
    const current = request()
    const writeText = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockRejectedValueOnce(COPY_ERROR)
      .mockReturnValueOnce(current.promise)
    const onError = vi.fn()
    const onCopy = vi.fn()
    const props = {label: 'draft', writeText, onError, onCopy}
    const {rerender, unmount} = render(
      <CopyTextButton {...props} value={RAW} />
    )
    fireEvent.click(screen.getByRole('button'))
    rerender(<CopyTextButton {...props} value={NEXT} />)
    await act(async () => old.resolve())
    expect(onCopy).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).toBeNull()
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(onError).toHaveBeenCalledExactlyOnceWith(COPY_ERROR, NEXT)
    expect(screen.getByRole('alert').textContent).toBe('Could not copy draft')
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent.click(screen.getByRole('button'))
    unmount()
    await act(async () => current.resolve())
    expect(onCopy).not.toHaveBeenCalled()
  })

  it('reports unavailable browser clipboard support without claiming success', async () => {
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    try {
      const onError = vi.fn()
      render(<CopyTextButton value={RAW} label="source" onError={onError} />)
      await act(async () => fireEvent.click(screen.getByRole('button')))
      expect(screen.getByRole('alert')).toBeTruthy()
      expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error), RAW)
      expect(screen.queryByRole('status')).toBeNull()
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })
})

describe('preview and context', () => {
  it('retains every ICU branch, offset, ordinal type, skeleton, and whitespace without executing tags', () => {
    const {container, rerender} = render(<MessagePreview message={COMPLEX} />)
    for (const text of [
      'offset:1',
      '=0 {',
      'one {',
      'other {',
      'female {',
      'selectordinal',
      '::currency/USD',
      '::yyyyMMdd',
      ', time, short',
      '<b>',
      '</b>',
      '#',
    ])
      expect(container.textContent).toContain(text)
    expect(container.querySelector('b')).toBeNull()
    rerender(<MessagePreview message={RAW} />)
    expect(container.textContent).toBe(RAW)
    rerender(
      <MessagePreview
        message="{broken"
        formatError={() => 'Incomplete message'}
      />
    )
    expect(screen.getByRole('alert').textContent).toBe('Incomplete message')
    rerender(<MessagePreview message="" />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(container.textContent).toBe('')
  })

  it('uses context adapters for preview tokens and metadata, copies IDs, and clears stale details', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const components: Partial<EditorComponents> = {
      PreviewToken: ({children, kind}) => <mark title={kind}>{children}</mark>,
      Metadata: ({children, label}) => (
        <section aria-label={label}>{children}</section>
      ),
      CopyButton: ({label, disabled, onPress}) => (
        <button type="button" disabled={disabled} onClick={onPress}>
          {label}
        </button>
      ),
    }
    const message = {
      id: 'example',
      description: 'A greeting',
      catalogs: ['web'],
      locations: [{file: 'Greeting.tsx', start: 0, end: 8}, {file: 'other.ts'}],
    }
    const tree = (show: boolean) => (
      <EditorDesignSystemProvider components={components}>
        <MessagePreview message={RAW} />
        <MessageContext
          message={show ? message : null}
          copyOptions={{writeText}}
        />
      </EditorDesignSystemProvider>
    )
    const {rerender} = render(tree(true))
    expect(screen.getByTitle('argument').textContent).toBe('{name}')
    const context = within(
      screen.getByRole('region', {name: 'Message context'})
    )
    expect(context.getByText('Greeting.tsx:0–8')).toBeTruthy()
    expect(context.getByText('other.ts')).toBeTruthy()
    expect(context.getByText('web')).toBeTruthy()
    expect(context.getByText('A greeting')).toBeTruthy()
    await act(async () =>
      fireEvent.click(context.getByRole('button', {name: 'Copy Message ID'}))
    )
    expect(writeText).toHaveBeenCalledExactlyOnceWith('example')
    rerender(tree(false))
    expect(context.queryByText('example')).toBeNull()
    expect(context.queryByRole('button')).toBeNull()
  })
})
