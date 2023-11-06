import {findBestMatch, findMatchingDistance} from '../abstract/utils'
test('findMatchingDistance', () => {
  expect(findMatchingDistance('es-CO', 'es')).toBe(49)
  expect(findMatchingDistance('es-CO', 'es-419')).toBe(39)
  expect(findMatchingDistance('en-US', 'en-US')).toBe(0)
  expect(findMatchingDistance('zh-TW', 'zh-Hant')).toBe(0)
  expect(findMatchingDistance('zh-HK', 'zh-NO')).toBe(540)
  expect(findMatchingDistance('zh-HK', 'zh-Hant')).toBe(40)
  expect(findMatchingDistance('vi', 'fr')).toBe(840)
  expect(findMatchingDistance('sr-Latn-BA', 'sr-Latn-RS')).toBe(40)
  expect(findMatchingDistance('sr-Latn-BA', 'bs-Latn-BA')).toBe(800)
})
test('findBestMatch', () => {
  expect(findBestMatch('en-US', ['en-US'])).toBe('en-US')
  expect(findBestMatch('sr-Latn-BA', ['bs', 'sh'])).toBe('sh')
  expect(findBestMatch('fr-XX', ['fr', 'en'])).toBe('fr')
  expect(findBestMatch('zh-TW', ['zh', 'zh-Hant'])).toBe('zh-Hant')
  expect(findBestMatch('th-u-ca-gregory', ['th'])).toBe('th')

  expect(findBestMatch('es-co', ['en', 'es-419'])).toBe('es-419')
  expect(findBestMatch('es-co', ['en', 'es', 'es-419'])).toBe('es-419')
  expect(findBestMatch('pt-mz', ['pt-PT', 'pt-BR'])).toBe('pt-PT')
})
