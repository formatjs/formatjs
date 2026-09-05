import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  Editor,
  MessagePreview,
  validateTranslation,
} from '#packages/editor/index.js'
import type {EditorMessage, TranslationUpdate} from '#packages/editor/types.js'

const MESSAGES: EditorMessage[] = [
  {
    id: 'welcome',
    defaultMessage: 'Welcome, <strong>{name}</strong>!',
    description: 'Greeting on the home page',
    catalogs: ['web'],
    locations: [{file: 'src/home.tsx', start: 12}],
    translations: {'fr-FR': 'Bienvenue, <strong>{name}</strong> !'},
  },
  {
    id: 'photo-count',
    defaultMessage:
      '{count, plural, =0 {No photos} one {One photo} other {# photos}}',
    catalogs: ['shared'],
    translations: {},
  },
]

afterEach(cleanup)

describe('validateTranslation', () => {
  it.each([
    ['', 'Enter a translation before saving.'],
    ['Bienvenue !', 'preserve every ICU argument'],
    ['Bienvenue, <em>{name}</em> !', 'preserve every ICU argument'],
    ['Bienvenue, <strong>{name}</strong>', null],
  ])('validates ICU structure for %j', (translation, expected) => {
    const result = validateTranslation(MESSAGES[0].defaultMessage, translation)
    if (expected === null) {
      expect(result).toBeNull()
    } else {
      expect(result).toContain(expected)
    }
  })

  it('preserves exact plural selectors while allowing locale-specific categories', () => {
    expect(
      validateTranslation(
        MESSAGES[1].defaultMessage,
        '{count, plural, =0 {Aucune photo} many {Beaucoup de photos} other {# photos}}'
      )
    ).toBeNull()
    expect(
      validateTranslation(
        MESSAGES[1].defaultMessage,
        '{count, plural, one {Une photo} other {# photos}}'
      )
    ).toContain('preserve every ICU argument')
  })
})

describe('MessagePreview', () => {
  it('renders literals and ICU syntax as separate tokens', () => {
    render(<MessagePreview message={MESSAGES[0].defaultMessage} />)

    expect(screen.getByText('Welcome,')).toBeInTheDocument()
    expect(screen.getByText('<strong>')).toHaveAttribute('data-kind', 'tag')
    expect(screen.getByText('{name}')).toHaveAttribute('data-kind', 'argument')
    expect(screen.getByText('</strong>')).toHaveAttribute('data-kind', 'tag')
  })

  it('surfaces parser errors without throwing', () => {
    render(<MessagePreview message="{count, plural, one {One}" />)

    expect(screen.getByRole('alert')).not.toBeEmptyDOMElement()
  })
})

describe('Editor', () => {
  it('filters messages and saves a structurally valid translation', async () => {
    const onSave = vi
      .fn<(update: TranslationUpdate) => Promise<void>>()
      .mockResolvedValue()
    render(
      <Editor
        defaultLocale="fr-FR"
        locales={['fr-FR']}
        messages={MESSAGES}
        onSave={onSave}
      />
    )

    fireEvent.change(screen.getByLabelText('Status'), {
      target: {value: 'missing'},
    })
    expect(
      screen.queryByRole('button', {name: /Welcome/})
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /No photos/}))

    const translation =
      '{count, plural, =0 {Aucune photo} one {Une photo} other {# photos}}'
    fireEvent.change(screen.getByLabelText('fr-FR translation'), {
      target: {value: translation},
    })
    fireEvent.click(screen.getByRole('button', {name: 'Save translation'}))

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        id: 'photo-count',
        locale: 'fr-FR',
        translation,
      })
    )
    expect(screen.getByRole('status')).toHaveTextContent('Translation saved.')
  })

  it('blocks saving when ICU arguments do not match the source', () => {
    render(
      <Editor
        defaultLocale="fr-FR"
        locales={['fr-FR']}
        messages={MESSAGES}
        onSave={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('fr-FR translation'), {
      target: {value: 'Bienvenue !'},
    })

    expect(
      screen.getByRole('button', {name: 'Save translation'})
    ).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'preserve every ICU argument'
    )
  })
})
