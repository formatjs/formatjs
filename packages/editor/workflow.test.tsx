import {act, cleanup, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  useTranslationEditor,
  validateTranslation,
  type EditorMessage,
  type TranslationEditorOptions,
  type TranslationSaveResult,
} from './index.js'

afterEach(cleanup)
const messages: EditorMessage[] = [
  {
    id: 'a',
    defaultMessage: 'First {name}',
    translations: {fr: 'Premier {name}'},
    catalogs: ['web'],
    locations: [{file: 'a.ts', start: 1}],
  },
  {
    id: 'b',
    defaultMessage: 'Second {name}',
    translations: {fr: 'Deuxième {name}'},
    catalogs: ['mobile'],
  },
]
function deferred(): {
  promise: Promise<void>
  resolve: () => void
  reject: (error: Error) => void
} {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => {
    resolve = yes
    reject = no
  })
  return {promise, resolve, reject}
}
function options(
  overrides: Partial<TranslationEditorOptions> = {}
): TranslationEditorOptions {
  return {messages, locales: ['fr', 'ru'], onSave: vi.fn(), ...overrides}
}

describe('translation workflow', () => {
  it('keeps save completion and reset scoped to the submitted message and locale', async () => {
    const request = deferred()
    const onSave = vi.fn(() => request.promise)
    const {result} = renderHook(() => useTranslationEditor(options({onSave})))
    act(() => result.current.editor.setTranslation('Saved {name}'))
    let save!: Promise<TranslationSaveResult>
    act(() => {
      save = result.current.save()
    })
    act(() => result.current.editor.selectMessage('b'))
    await act(async () => {
      request.resolve()
      await save
    })
    expect(result.current.changed).toBe(false)
    expect(result.current.saved).toBe(false)
    act(() => result.current.reset())
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Deuxième {name}'
    )
    act(() => result.current.editor.selectMessage('a'))
    expect(result.current.saved).toBe(true)
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Saved {name}'
    )
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      {id: 'a', locale: 'fr', translation: 'Saved {name}'},
      {
        source: 'First {name}',
        baselineTranslation: 'Premier {name}',
        context: undefined,
      }
    )
  })

  it('preserves edits typed while persistence updates controlled messages', async () => {
    const request = deferred()
    const initial = options({onSave: () => request.promise})
    const {result, rerender} = renderHook(
      props => useTranslationEditor(props),
      {initialProps: initial}
    )
    act(() => result.current.editor.setTranslation('Submitted {name}'))
    let save!: Promise<TranslationSaveResult>
    act(() => {
      save = result.current.save()
    })
    act(() => result.current.editor.setTranslation('Newer {name}'))
    rerender({
      ...initial,
      messages: [
        {...messages[0], translations: {fr: 'Submitted {name}'}},
        messages[1],
      ],
    })
    await act(async () => {
      request.resolve()
      await save
    })
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Newer {name}'
    )
    expect(result.current.changed).toBe(true)
    expect(result.current.saved).toBe(false)
    act(() => result.current.reset())
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Submitted {name}'
    )
  })

  it('retains drafts across locale, selection, and filter changes', () => {
    const {result} = renderHook(() => useTranslationEditor(options()))
    act(() => result.current.editor.setTranslation('Brouillon {name}'))
    act(() => result.current.setLocale('ru'))
    act(() => result.current.editor.setTranslation('Черновик {name}'))
    act(() => result.current.setCatalog('mobile'))
    act(() => result.current.setCatalog(''))
    act(() => result.current.setLocale('fr'))
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Brouillon {name}'
    )
    act(() => result.current.setLocale('ru'))
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Черновик {name}'
    )
  })

  it('reconciles locales loaded or removed after mount and never saves an absent locale', async () => {
    const onSave = vi.fn()
    const initial = options({locales: [], onSave})
    const {result, rerender} = renderHook(
      props => useTranslationEditor(props),
      {initialProps: initial}
    )
    await act(async () => {
      await result.current.save()
    })
    expect(onSave).not.toHaveBeenCalled()
    rerender({...initial, locales: ['fr']})
    expect(result.current.locale).toBe('fr')
    act(() => result.current.editor.setTranslation('Bonjour {name}'))
    await act(async () => {
      await result.current.save()
    })
    expect(onSave).toHaveBeenCalledWith(
      {id: 'a', locale: 'fr', translation: 'Bonjour {name}'},
      {
        source: 'First {name}',
        baselineTranslation: 'Premier {name}',
        context: undefined,
      }
    )
    rerender({...initial, locales: ['ru']})
    expect(result.current.locale).toBe('ru')
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe('')
  })

  it('clamps pages when messages shrink or page size changes', () => {
    const initial = options({pageSize: 1})
    const {result, rerender} = renderHook(
      props => useTranslationEditor(props),
      {initialProps: initial}
    )
    act(() => result.current.setPage(1))
    expect(result.current.pageMessages[0].id).toBe('b')
    rerender({...initial, messages: [messages[0]]})
    expect(result.current.page).toBe(0)
    expect(result.current.pageMessages[0].id).toBe('a')
    rerender({...initial, pageSize: NaN})
    expect(result.current.pageMessages).toHaveLength(2)
  })

  it('isolates failures and prevents duplicate saves without locking other messages', async () => {
    const request = deferred()
    const onSave = vi.fn(() => request.promise)
    const {result} = renderHook(() => useTranslationEditor(options({onSave})))
    act(() => result.current.editor.setTranslation('Changed {name}'))
    let save!: Promise<TranslationSaveResult>
    act(() => {
      save = result.current.save()
      void result.current.save()
    })
    expect(onSave).toHaveBeenCalledTimes(1)
    act(() => result.current.setLocale('ru'))
    await act(async () => {
      request.reject(new Error('Offline'))
      await save
    })
    expect(result.current.saveError).toBeNull()
    expect(result.current.isSaving).toBe(false)
    act(() => result.current.setLocale('fr'))
    expect(result.current.saveError?.message).toBe('Offline')
    expect(result.current.changed).toBe(true)
  })

  it('searches, filters persisted status, and updates clean drafts from consumer state', async () => {
    const initial = options()
    const {result, rerender} = renderHook(
      props => useTranslationEditor(props),
      {initialProps: initial}
    )
    act(() => result.current.editor.setQuery('second'))
    expect(result.current.editor.messages.map(message => message.id)).toEqual([
      'b',
    ])
    act(() => result.current.editor.setQuery(''))
    rerender({
      ...initial,
      messages: [
        {...messages[0], translations: {fr: 'Fresh {name}'}},
        messages[1],
      ],
    })
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Fresh {name}'
    )
    act(() => result.current.setLocale('ru'))
    act(() => result.current.setStatus('missing'))
    act(() => result.current.editor.setTranslation('Перевод {name}'))
    expect(result.current.editor.messages).toHaveLength(2)
    await act(async () => {
      await result.current.save()
    })
    expect(result.current.editor.messages.map(message => message.id)).toEqual([
      'b',
    ])
  })
})

describe('translation validation', () => {
  it('allows locale-specific plural branches and repeated placeholders', () => {
    expect(
      validateTranslation(
        '{n, plural, one {{name} has one} other {{name} has #}}',
        '{n, plural, one {{name} a} few {{name} b} many {{name} c} other {{name} d}}'
      )
    ).toBeNull()
    expect(
      validateTranslation('Hi {name}. Bye {name}', 'Bonjour {name}')
    ).toBeNull()
  })
  it.each([
    ['{n, plural, =0 {None} other {{name}}}', '{n, plural, other {{name}}}'],
    [
      '{n, plural, other {{name}}}',
      '{n, plural, few {Missing argument} other {{name}}}',
    ],
    ['{n, plural, offset:1 other {#}}', '{n, plural, other {#}}'],
    [
      '{gender, select, male {{name}} other {{other}}}',
      '{gender, select, male {{other}} other {{name}}}',
    ],
    ['<b>{name}</b>', '<b>Hello</b>{name}'],
    ['{n, number, ::currency/USD}', '{n, number, ::currency/EUR}'],
  ])(
    'rejects changed branch or formatting contracts',
    (source, translation) => {
      expect(validateTranslation(source, translation)).toBe('structure')
    }
  )
  it('returns localizable syntax and empty error codes', () => {
    expect(validateTranslation('hello', '')).toBe('empty')
    expect(validateTranslation('{', 'hello')).toBe('invalid-source')
    expect(validateTranslation('hello', '{')).toBe('invalid-translation')
  })
})
