import {act, cleanup, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  hasTranslationForEveryLocale,
  matchesMessageStatus,
  useTranslationLayout,
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

  it('resets pagination when exactness or text scope changes', () => {
    const {result} = renderHook(() =>
      useTranslationEditor(options({pageSize: 1}))
    )
    act(() => result.current.setPage(1))
    expect(result.current.page).toBe(1)
    act(() => result.current.editor.setSearchMode('exact'))
    expect(result.current.page).toBe(0)
    act(() => result.current.setPage(1))
    act(() => result.current.editor.setSearchScope('translation'))
    expect(result.current.page).toBe(0)
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
    act(() => result.current.editor.setDescriptionQuery('not present'))
    expect(result.current.editor.messages).toEqual([])
    expect(result.current.page).toBe(0)
    act(() => result.current.editor.setDescriptionQuery(''))
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

describe('projects and sources', () => {
  const projects = [
    {id: 'web', label: 'Web app'},
    {id: 'mobile', label: 'Mobile app', description: 'Phone and tablet'},
  ]
  const sourced: EditorMessage[] = [
    {
      id: 'a',
      defaultMessage: 'First {name}',
      translations: {fr: 'Premier {name}'},
      catalogs: ['web'],
      sources: ['main', 'release'],
    },
    {
      id: 'b',
      defaultMessage: 'Second {name}',
      translations: {fr: 'Deuxième {name}'},
      catalogs: ['web'],
      sources: ['release'],
    },
    {
      id: 'c',
      defaultMessage: 'Third {name}',
      translations: {},
      catalogs: ['mobile'],
      sources: ['main'],
    },
    {
      id: 'd',
      defaultMessage: 'Fourth {name}',
      translations: {fr: 'Quatrième {name}'},
    },
  ]
  const ids = (state: {editor: {messages: readonly {id: string}[]}}) =>
    state.editor.messages.map(message => message.id)

  it('composes the source filter with status, catalog, and search filters', () => {
    const {result} = renderHook(() =>
      useTranslationEditor(options({messages: sourced, pageSize: 1}))
    )
    expect(result.current.sources).toEqual(['main', 'release'])
    expect(result.current.source).toBe('')
    expect(ids(result.current)).toEqual(['a', 'b', 'c', 'd'])
    act(() => result.current.setPage(2))
    act(() => result.current.setSource('main'))
    expect(result.current.page).toBe(0)
    expect(ids(result.current)).toEqual(['a', 'c'])
    act(() => result.current.setStatus('missing'))
    expect(ids(result.current)).toEqual(['c'])
    act(() => result.current.setStatus('all'))
    act(() => result.current.setCatalog('web'))
    expect(ids(result.current)).toEqual(['a'])
    act(() => result.current.editor.setQuery('second'))
    expect(ids(result.current)).toEqual([])
    act(() => result.current.setSource('release'))
    expect(ids(result.current)).toEqual(['b'])
    act(() => result.current.setSource('unknown'))
    expect(result.current.source).toBe('')
    act(() => result.current.editor.setQuery(''))
    act(() => result.current.setCatalog(''))
    expect(ids(result.current)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('exposes no sources and no project without the optional metadata', () => {
    const {result} = renderHook(() => useTranslationEditor(options()))
    expect(result.current.sources).toEqual([])
    expect(result.current.projects).toEqual([])
    expect(result.current.project).toBeUndefined()
    expect(result.current.setProject('web')).toEqual({
      status: 'blocked',
      reason: 'unknown-project',
    })
  })

  it('switches uncontrolled projects and resets paging, selection, and filters', () => {
    const onProjectChange = vi.fn()
    const {result} = renderHook(() =>
      useTranslationEditor(
        options({
          messages: sourced,
          pageSize: 1,
          projects,
          defaultProject: 'mobile',
          onProjectChange,
        })
      )
    )
    expect(result.current.project).toEqual(projects[1])
    act(() => result.current.editor.selectMessage('b'))
    act(() => result.current.setCatalog('web'))
    act(() => result.current.setSource('release'))
    act(() => result.current.setStatus('translated'))
    act(() => result.current.setPage(1))
    expect(ids(result.current)).toEqual(['a', 'b'])
    expect(result.current.selectedMessage?.id).toBe('b')
    expect(result.current.setProject('mobile')).toEqual({status: 'unchanged'})
    expect(result.current.catalog).toBe('web')
    expect(result.current.page).toBe(1)
    expect(onProjectChange).not.toHaveBeenCalled()
    let outcome!: ReturnType<typeof result.current.setProject>
    act(() => {
      outcome = result.current.setProject('web')
    })
    expect(outcome).toEqual({status: 'changed', project: projects[0]})
    expect(onProjectChange).toHaveBeenCalledExactlyOnceWith('web')
    expect(result.current.project).toEqual(projects[0])
    expect(result.current.page).toBe(0)
    expect(result.current.catalog).toBe('')
    expect(result.current.source).toBe('')
    expect(result.current.status).toBe('translated')
    expect(result.current.selectedMessage?.id).toBe('a')
    expect(result.current.setProject('desktop')).toEqual({
      status: 'blocked',
      reason: 'unknown-project',
    })
  })

  it('blocks project changes while drafts are unsaved unless they are discarded', () => {
    const onProjectChange = vi.fn()
    const initial = options({
      messages: sourced,
      projects,
      defaultProject: 'web',
      onProjectChange,
    })
    const {result, rerender} = renderHook(
      props => useTranslationEditor(props),
      {initialProps: initial}
    )
    act(() => result.current.editor.setTranslation('Brouillon {name}'))
    act(() => result.current.editor.selectMessage('b'))
    let outcome!: ReturnType<typeof result.current.setProject>
    act(() => {
      outcome = result.current.setProject('mobile')
    })
    expect(outcome).toEqual({status: 'blocked', reason: 'unsaved-drafts'})
    expect(onProjectChange).not.toHaveBeenCalled()
    expect(result.current.project).toEqual(projects[0])
    expect(result.current.getTranslation('a', 'fr')?.value).toBe(
      'Brouillon {name}'
    )
    act(() => result.current.getTranslation('a', 'fr')?.reset())
    act(() => {
      outcome = result.current.setProject('mobile')
    })
    expect(outcome).toEqual({status: 'changed', project: projects[1]})
    expect(onProjectChange).toHaveBeenCalledExactlyOnceWith('mobile')
    act(() => result.current.editor.setTranslation('Autre {name}'))
    act(() => {
      outcome = result.current.setProject('web', {discardDrafts: true})
    })
    expect(outcome).toEqual({status: 'changed', project: projects[0]})
    expect(result.current.changed).toBe(false)
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Premier {name}'
    )
    rerender({...initial, messages: [sourced[3]]})
    expect(result.current.selectedMessage?.id).toBe('d')
    expect(result.current.sources).toEqual([])
  })

  it.each(['saved', 'failed'] as const)(
    'ignores %s save completion after discarding and switching projects',
    async outcome => {
      const request = deferred()
      const initial = options({
        projects,
        project: 'web',
        onSave: () => request.promise,
      })
      const {result, rerender} = renderHook(
        props => useTranslationEditor(props),
        {initialProps: initial}
      )
      act(() => result.current.editor.setTranslation('Web draft {name}'))
      let save!: Promise<TranslationSaveResult>
      act(() => {
        save = result.current.save()
      })
      act(() => {
        result.current.setProject('mobile', {discardDrafts: true})
      })
      rerender({
        ...initial,
        project: 'mobile',
        messages: [{...messages[0], translations: {fr: 'Mobile {name}'}}],
      })
      act(() => result.current.editor.setTranslation('Mobile draft {name}'))
      await act(async () => {
        if (outcome === 'saved') request.resolve()
        else request.reject(new Error('Web save failed'))
        expect((await save).status).toBe(outcome)
      })
      expect(result.current.getTranslation('a', 'fr')?.baseline).toBe(
        'Mobile {name}'
      )
      expect(result.current.saveError).toBeNull()
      expect(result.current.saved).toBe(false)
      act(() => result.current.reset())
      expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
        'Mobile {name}'
      )
    }
  )

  it('isolates pending guards and retained handlers across controlled projects', async () => {
    const web = deferred()
    const mobile = deferred()
    const initial = options({
      projects,
      project: 'web',
      onSave: () => web.promise,
    })
    const {result, rerender} = renderHook(
      props => useTranslationEditor(props),
      {initialProps: initial}
    )
    act(() => result.current.editor.setTranslation('Web draft {name}'))
    const retained = result.current.getTranslation('a', 'fr')!
    let webSave!: Promise<TranslationSaveResult>
    act(() => {
      webSave = retained.save()
    })
    const mobileSaveHandler = vi.fn(() => mobile.promise)
    rerender({...initial, project: 'mobile', onSave: mobileSaveHandler})
    expect(result.current.isSaving).toBe(false)
    expect(result.current.changed).toBe(false)
    act(() => {
      retained.setTranslation('Stale {name}')
      retained.reset()
    })
    expect(await retained.save()).toEqual({
      status: 'skipped',
      reason: 'unavailable',
    })
    act(() => result.current.editor.setTranslation('Mobile draft {name}'))
    let mobileSave!: Promise<TranslationSaveResult>
    act(() => {
      mobileSave = result.current.save()
    })
    expect(mobileSaveHandler).toHaveBeenCalledOnce()
    await act(async () => {
      web.resolve()
      await webSave
    })
    expect(result.current.isSaving).toBe(true)
    expect(await result.current.save()).toEqual({
      status: 'skipped',
      reason: 'pending',
    })
    await act(async () => {
      mobile.resolve()
      await mobileSave
    })
    expect(result.current.isSaving).toBe(false)
    expect(result.current.getTranslation('a', 'fr')?.baseline).toBe(
      'Mobile draft {name}'
    )
  })

  it('does not revive old drafts or save completions when returning to a project', async () => {
    const request = deferred()
    const initial = options({
      projects,
      project: 'web',
      onSave: () => request.promise,
    })
    const {result, rerender} = renderHook(
      props => useTranslationEditor(props),
      {initialProps: initial}
    )
    act(() => result.current.editor.setTranslation('Old web {name}'))
    let save!: Promise<TranslationSaveResult>
    act(() => {
      save = result.current.save()
    })
    rerender({...initial, project: 'mobile'})
    rerender(initial)
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Premier {name}'
    )
    act(() => result.current.editor.setTranslation('New web {name}'))
    await act(async () => {
      request.resolve()
      await save
    })
    expect(result.current.getTranslation('a', 'fr')?.baseline).toBe(
      'Premier {name}'
    )
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'New web {name}'
    )
    act(() => result.current.reset())
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Premier {name}'
    )
    let change!: ReturnType<typeof result.current.setProject>
    act(() => {
      change = result.current.setProject('mobile')
    })
    expect(change.status).toBe('changed')
  })

  it('keeps a controlled project until the consumer applies the change', () => {
    const onProjectChange = vi.fn()
    const initial = options({
      messages: sourced,
      projects,
      project: 'web',
      onProjectChange,
    })
    const {result, rerender} = renderHook(
      props => useTranslationEditor(props),
      {initialProps: initial}
    )
    act(() => result.current.setSource('main'))
    let outcome!: ReturnType<typeof result.current.setProject>
    act(() => {
      outcome = result.current.setProject('mobile')
    })
    expect(outcome).toEqual({status: 'changed', project: projects[1]})
    expect(onProjectChange).toHaveBeenCalledExactlyOnceWith('mobile')
    expect(result.current.project).toEqual(projects[0])
    expect(result.current.source).toBe('')
    rerender({...initial, project: 'mobile', messages: [sourced[2]]})
    expect(result.current.project).toEqual(projects[1])
    expect(result.current.selectedMessage?.id).toBe('c')
    rerender({...initial, project: 'missing'})
    expect(result.current.project).toEqual(projects[0])
  })
})

describe('editor preferences and status', () => {
  it('keeps explicitly undefined translations in the missing filter', () => {
    const {result} = renderHook(() =>
      useTranslationEditor({
        messages: [
          {
            id: 'missing',
            defaultMessage: 'Hello',
            translations: {fr: undefined},
          },
        ],
        locales: ['fr'],
        onSave: () => {},
      })
    )
    act(() => result.current.setStatus('missing'))
    expect(result.current.editor.messages.map(message => message.id)).toEqual([
      'missing',
    ])
  })

  it('uses all-selected versus any-missing translation status semantics', () => {
    const translations = {fr: '', de: 'Hallo', ja: undefined}
    expect(hasTranslationForEveryLocale(translations, ['fr', 'de'])).toBe(true)
    expect(hasTranslationForEveryLocale(translations, ['fr', 'ja'])).toBe(false)
    expect(hasTranslationForEveryLocale(translations, [])).toBe(false)
    expect(matchesMessageStatus(translations, ['fr', 'de'], 'translated')).toBe(
      true
    )
    expect(matchesMessageStatus(translations, ['fr', 'ja'], 'missing')).toBe(
      true
    )
  })

  it('defaults to grid, restores a valid layout, and tolerates storage failures', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    const {result, unmount} = renderHook(() =>
      useTranslationLayout({storageKey: 'layout', storage})
    )
    expect(result.current.layout).toBe('grid')
    act(() => result.current.setLayout('list'))
    expect(result.current.layout).toBe('list')
    expect(values.get('layout')).toBe('"list"')
    unmount()
    const restored = renderHook(() =>
      useTranslationLayout({storageKey: 'layout', storage})
    )
    expect(restored.result.current.layout).toBe('list')

    const unavailable = renderHook(() =>
      useTranslationLayout({
        storageKey: 'layout',
        storage: {
          getItem: () => {
            throw new Error('unavailable')
          },
          setItem: () => {
            throw new Error('unavailable')
          },
        },
      })
    )
    expect(unavailable.result.current.layout).toBe('grid')
    act(() => unavailable.result.current.setLayout('list'))
    expect(unavailable.result.current.layout).toBe('list')
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
