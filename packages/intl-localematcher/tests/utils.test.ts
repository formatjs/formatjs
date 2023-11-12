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
  expect(findBestMatch(['en-US'], ['en-US'])).toMatchSnapshot()
  expect(findBestMatch(['sr-Latn-BA'], ['bs', 'sh'])).toMatchSnapshot()
  expect(findBestMatch(['fr-XX'], ['fr', 'en'])).toMatchSnapshot()
  expect(findBestMatch(['zh-TW'], ['zh', 'zh-Hant'])).toMatchSnapshot()
  expect(findBestMatch(['th-u-ca-gregory'], ['th'])).toMatchSnapshot()

  expect(findBestMatch(['es-co'], ['en', 'es-419'])).toMatchSnapshot()
  expect(findBestMatch(['es-co'], ['en', 'es', 'es-419'])).toMatchSnapshot()
  expect(findBestMatch(['pt-mz'], ['pt-PT', 'pt-BR'])).toMatchSnapshot()
  expect(
    findBestMatch(['de-DE', 'fr-FR'], ['en', 'en-US', 'fr-FR'])
  ).toMatchSnapshot()
})
