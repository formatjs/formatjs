import {findBestMatch, findMatchingDistance} from '../abstract/utils'
test('findMatchingDistance', () => {
  expect(findMatchingDistance('en-US', 'en-US')).toBe(0)
  expect(findMatchingDistance('zh-TW', 'zh-Hant')).toBe(0)
  expect(findMatchingDistance('zh-HK', 'zh-NO')).toBe(80)
  expect(findMatchingDistance('zh-HK', 'zh-Hant')).toBe(40)
  expect(findMatchingDistance('es-CO', 'es')).toBe(39)
  expect(findMatchingDistance('es-CO', 'es-419')).toBe(39)
})
test('findBestMatch', () => {
  expect(findBestMatch('en-US', ['en-US'])).toBe('en-US')
  expect(findBestMatch('fr-XX', ['fr', 'en'])).toBe('fr')
  expect(findBestMatch('zh-TW', ['zh', 'zh-Hant'])).toBe('zh-Hant')
  expect(findBestMatch('th-u-ca-gregory', ['th'])).toBe('th')

  expect(findBestMatch('es-co', ['en', 'es-419'])).toBe('es-419')
  // TODO: This should be es-419
  //   expect(findBestMatch('es-co', ['en', 'es', 'es-419'])).toBe('es-419')
  expect(findBestMatch('pt-mz', ['pt-PT', 'pt-BR'])).toBe('pt-PT')
})
