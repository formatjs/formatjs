import {LookupMatcher} from '../LookupMatcher';

test('LookupMatcher', function () {
  expect(LookupMatcher(['fr', 'en'], ['fr-XX', 'en'], () => 'en')).toEqual({
    locale: 'fr',
  });
});
