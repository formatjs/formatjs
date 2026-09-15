import {describe, expect, it} from 'vitest'
import {
  matchesDescriptionSearch,
  matchesMessageSearch,
} from '#packages/editor/index.js'

describe('message search', () => {
  it('matches every whitespace-delimited description term in any order', () => {
    const description =
      'Result label indicating a correctly answered quiz question.'
    expect(matchesDescriptionSearch(description, 'quiz label')).toBe(true)
    expect(matchesDescriptionSearch(description, 'LABEL   quiz')).toBe(true)
    expect(matchesDescriptionSearch(description, 'quiz input label')).toBe(
      false
    )
    expect(matchesDescriptionSearch(undefined, 'quiz')).toBe(false)
    expect(matchesDescriptionSearch(undefined, '   ')).toBe(true)
  })

  it('supports partial and exact source matching without word-boundary matches', () => {
    const target = {
      id: 'action-open',
      source: 'Open',
      translations: ['Ouvrir'],
    }
    expect(matchesMessageSearch(target, 'open')).toBe(true)
    expect(
      matchesMessageSearch({...target, source: 'Open window'}, 'Open')
    ).toBe(true)
    expect(matchesMessageSearch(target, 'OPEN', {mode: 'exact'})).toBe(true)
    expect(
      matchesMessageSearch({...target, source: 'Open window'}, 'Open', {
        mode: 'exact',
      })
    ).toBe(false)
  })

  it('scopes text to source, selected translations, or both', () => {
    const target = {
      id: 'different-id',
      source: 'Open',
      translations: ['Ouvrir', 'Öffnen'],
    }
    expect(matchesMessageSearch(target, 'ouvrir', {scope: 'source'})).toBe(
      false
    )
    expect(matchesMessageSearch(target, 'open', {scope: 'translation'})).toBe(
      false
    )
    expect(
      matchesMessageSearch(target, 'ÖFFNEN', {
        mode: 'exact',
        scope: 'translation',
      })
    ).toBe(true)
    expect(matchesMessageSearch(target, 'open', {scope: 'both'})).toBe(true)
  })

  it('keeps long identifier fragments discoverable without broadening short exact text', () => {
    const target = {
      id: 'message000b95ae99',
      source: 'Result',
      translations: ['Résultat'],
      metadata: ['components/QuizResult.tsx:42'],
    }
    expect(
      matchesMessageSearch(target, '000b95ae99', {
        mode: 'exact',
        scope: 'translation',
      })
    ).toBe(true)
    expect(
      matchesMessageSearch(target, 'components/QuizResult.tsx:42', {
        mode: 'exact',
        scope: 'source',
      })
    ).toBe(true)
    expect(
      matchesMessageSearch({...target, id: 'open-window'}, 'open', {
        mode: 'exact',
      })
    ).toBe(false)
  })
})
