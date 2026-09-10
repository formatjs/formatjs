import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  useTranslationEditor,
  type EditorMessage,
  type TranslationSaveResult,
  type TranslationSaveSnapshot,
  type TranslationUpdate,
} from '#packages/editor/index.js'

afterEach(cleanup)
const SOURCE = 'Hello {name}'
const FRENCH = 'Bonjour {name}'
const GERMAN = 'Hallo {name}'
const DRAFT = 'Salut {name}'
const NEWER_DRAFT = 'Bienvenue {name}'
const messages: EditorMessage[] = [
  {
    id: 'greeting',
    defaultMessage: SOURCE,
    translations: {fr: FRENCH, de: GERMAN},
  },
]
const locales = ['fr', 'de']

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return {promise, resolve, reject}
}

describe('multi-locale drafts', () => {
  it('keeps independent drafts and validation when locale views unmount', () => {
    function Example({visibleLocales}: {visibleLocales: string[]}) {
      const workflow = useTranslationEditor({
        messages,
        locales,
        onSave: () => {},
      })
      return visibleLocales.map(locale => {
        const draft = workflow.getTranslation('greeting', locale)!
        return (
          <textarea
            key={locale}
            aria-label={locale}
            aria-invalid={!!draft.validationError}
            value={draft.value}
            onChange={event => draft.setTranslation(event.target.value)}
          />
        )
      })
    }
    const {rerender} = render(<Example visibleLocales={locales} />)
    fireEvent.change(screen.getByRole('textbox', {name: 'fr'}), {
      target: {value: DRAFT},
    })
    fireEvent.change(screen.getByRole('textbox', {name: 'de'}), {
      target: {value: 'Hallo'},
    })
    expect(
      screen.getByRole('textbox', {name: 'de'}).getAttribute('aria-invalid')
    ).toBe('true')
    expect(
      screen.getByRole('textbox', {name: 'fr'}).getAttribute('aria-invalid')
    ).toBe('false')
    rerender(<Example visibleLocales={[]} />)
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    rerender(<Example visibleLocales={locales} />)
    expect(
      (screen.getByRole('textbox', {name: 'fr'}) as HTMLTextAreaElement).value
    ).toBe(DRAFT)
    expect(
      (screen.getByRole('textbox', {name: 'de'}) as HTMLTextAreaElement).value
    ).toBe('Hallo')
  })

  it('shares drafts with the existing selected-locale workflow and scopes reset', () => {
    const {result} = renderHook(() =>
      useTranslationEditor({messages, locales, onSave: () => {}})
    )
    act(() =>
      result.current.getTranslation('greeting', 'fr')!.setTranslation(DRAFT)
    )
    act(() =>
      result.current
        .getTranslation('greeting', 'de')!
        .setTranslation('Guten Tag {name}')
    )
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(DRAFT)
    act(() => result.current.reset())
    expect(result.current.getTranslation('greeting', 'fr')!.value).toBe(FRENCH)
    expect(result.current.getTranslation('greeting', 'de')!.changed).toBe(true)
    act(() => result.current.setLocale('de'))
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      'Guten Tag {name}'
    )
  })

  it('returns caller results and immutable submission metadata without mixing concurrent locales', async () => {
    type Context = {intent: 'review' | 'save'}
    type Receipt = {revision: string}
    const requests = {fr: deferred<Receipt>(), de: deferred<Receipt>()}
    const onSave = vi.fn(
      (
        update: TranslationUpdate,
        snapshot: TranslationSaveSnapshot<Context>
      ) => {
        expect(Object.isFrozen(snapshot)).toBe(true)
        return requests[update.locale as 'fr' | 'de'].promise
      }
    )
    const {result} = renderHook(() =>
      useTranslationEditor<Context, Receipt>({messages, locales, onSave})
    )
    act(() =>
      result.current.getTranslation('greeting', 'fr')!.setTranslation(DRAFT)
    )
    act(() =>
      result.current
        .getTranslation('greeting', 'de')!
        .setTranslation('Guten Tag {name}')
    )
    let french!: Promise<TranslationSaveResult<Receipt>>
    let german!: Promise<TranslationSaveResult<Receipt>>
    act(() => {
      french = result.current
        .getTranslation('greeting', 'fr')!
        .save({intent: 'review'})
      german = result.current
        .getTranslation('greeting', 'de')!
        .save({intent: 'save'})
    })
    expect(result.current.getTranslation('greeting', 'fr')!.isSaving).toBe(true)
    expect(result.current.getTranslation('greeting', 'de')!.isSaving).toBe(true)
    expect(onSave).toHaveBeenNthCalledWith(
      1,
      {id: 'greeting', locale: 'fr', translation: DRAFT},
      {source: SOURCE, baselineTranslation: FRENCH, context: {intent: 'review'}}
    )
    expect(onSave).toHaveBeenNthCalledWith(
      2,
      {id: 'greeting', locale: 'de', translation: 'Guten Tag {name}'},
      {source: SOURCE, baselineTranslation: GERMAN, context: {intent: 'save'}}
    )
    act(() =>
      result.current
        .getTranslation('greeting', 'fr')!
        .setTranslation(NEWER_DRAFT)
    )
    await act(async () => {
      requests.de.resolve({revision: 'de-1'})
      expect(await german).toEqual({status: 'saved', value: {revision: 'de-1'}})
    })
    expect(result.current.getTranslation('greeting', 'fr')!.isSaving).toBe(true)
    expect(result.current.getTranslation('greeting', 'de')!.saved).toBe(true)
    await act(async () => {
      requests.fr.resolve({revision: 'fr-1'})
      expect(await french).toEqual({status: 'saved', value: {revision: 'fr-1'}})
    })
    expect(result.current.getTranslation('greeting', 'fr')!.value).toBe(
      NEWER_DRAFT
    )
    expect(result.current.getTranslation('greeting', 'fr')!.changed).toBe(true)
    act(() => result.current.getTranslation('greeting', 'fr')!.reset())
    expect(result.current.getTranslation('greeting', 'fr')!.value).toBe(DRAFT)
  })

  it('submits the confirmed render snapshot after selection, drafts, and catalog metadata change', async () => {
    const onSave = vi.fn(() => 'revision-1')
    const {result, rerender} = renderHook(
      props =>
        useTranslationEditor<{intent: string}, string>({...props, onSave}),
      {initialProps: {messages, locales}}
    )
    act(() => result.current.editor.setTranslation(DRAFT))
    const confirmed = result.current.getTranslation('greeting', 'fr')!
    act(() => result.current.editor.setTranslation(NEWER_DRAFT))
    act(() => result.current.setLocale('de'))
    rerender({
      messages: [
        {
          id: 'greeting',
          defaultMessage: 'Welcome {name}',
          translations: {fr: 'Bonsoir {name}', de: GERMAN},
        },
      ],
      locales,
    })
    await act(async () => {
      expect(await confirmed.save({intent: 'review'})).toEqual({
        status: 'saved',
        value: 'revision-1',
      })
    })
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      {id: 'greeting', locale: 'fr', translation: DRAFT},
      {source: SOURCE, baselineTranslation: FRENCH, context: {intent: 'review'}}
    )
    expect(result.current.getTranslation('greeting', 'fr')!.value).toBe(
      NEWER_DRAFT
    )
    expect(result.current.getTranslation('greeting', 'fr')!.baseline).toBe(
      DRAFT
    )
    expect(result.current.getTranslation('greeting', 'fr')!.changed).toBe(true)
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(
      GERMAN
    )
  })

  it('reports pending and failed saves explicitly, preserves the draft, and supports retry', async () => {
    const request = deferred<string>()
    const error = new Error('Offline')
    const onSave = vi
      .fn()
      .mockImplementationOnce(() => request.promise)
      .mockResolvedValue('revision-2')
    const {result} = renderHook(() =>
      useTranslationEditor({messages, locales, onSave})
    )
    act(() => result.current.editor.setTranslation(DRAFT))
    let save!: ReturnType<typeof result.current.save>
    act(() => {
      save = result.current.save()
    })
    await act(async () => {
      expect(
        await result.current.getTranslation('greeting', 'fr')!.save()
      ).toEqual({status: 'skipped', reason: 'pending'})
      request.reject(error)
      expect(await save).toEqual({status: 'failed', error})
    })
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(result.current.saveError).toBe(error)
    expect(
      result.current.getTranslation('greeting', 'de')!.saveError
    ).toBeNull()
    expect(result.current.editor.selectedMessage?.translatedMessage).toBe(DRAFT)
    await act(async () => {
      expect(await result.current.save()).toEqual({
        status: 'saved',
        value: 'revision-2',
      })
    })
    expect(result.current.saved).toBe(true)
    expect(result.current.saveError).toBeNull()
  })

  it('returns validation and unavailable outcomes without calling persistence', async () => {
    const onSave = vi.fn()
    const {result, rerender} = renderHook(
      props => useTranslationEditor({...props, onSave}),
      {initialProps: {messages, locales}}
    )
    expect(await result.current.save()).toEqual({
      status: 'skipped',
      reason: 'unchanged',
    })
    act(() => result.current.editor.setTranslation('Missing placeholder'))
    expect(await result.current.save()).toEqual({
      status: 'invalid',
      validationError: 'structure',
    })
    act(() => result.current.editor.setTranslation(DRAFT))
    const removed = result.current.getTranslation('greeting', 'fr')!
    rerender({messages, locales: ['de']})
    expect(await removed.save()).toEqual({
      status: 'skipped',
      reason: 'unavailable',
    })
    expect(result.current.getTranslation('greeting', 'fr')).toBeUndefined()
    expect(result.current.getTranslation('unknown', 'de')).toBeUndefined()
    rerender({messages: [], locales: []})
    expect(await result.current.save()).toEqual({
      status: 'skipped',
      reason: 'unavailable',
    })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('preserves a completed save while its message is absent from a loaded page', async () => {
    const request = deferred<void>()
    const {result, rerender} = renderHook(
      props => useTranslationEditor({...props, onSave: () => request.promise}),
      {initialProps: {messages, locales}}
    )
    act(() => result.current.editor.setTranslation(DRAFT))
    let save!: ReturnType<typeof result.current.save>
    act(() => {
      save = result.current.save()
    })
    rerender({messages: [], locales})
    await act(async () => {
      request.resolve()
      await save
    })
    rerender({messages, locales})
    const draft = result.current.getTranslation('greeting', 'fr')!
    expect(draft.value).toBe(DRAFT)
    expect(draft.baseline).toBe(DRAFT)
    expect(draft.saved).toBe(true)
    expect(draft.isSaving).toBe(false)
  })
})
