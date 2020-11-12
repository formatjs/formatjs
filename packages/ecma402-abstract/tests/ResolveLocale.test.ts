import {ResolveLocale} from '../src/ResolveLocale';

test('ResolveLocale', function () {
  expect(
    ResolveLocale(
      ['fr', 'en'],
      ['fr-XX', 'en'],
      {localeMatcher: 'best fit'},
      [],
      {},
      () => 'en'
    )
  ).toEqual({
    dataLocale: 'fr',
    locale: 'fr',
  });
});
