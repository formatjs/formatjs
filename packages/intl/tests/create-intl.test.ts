import {createIntl} from '../src/create-intl';

test('createIntl', function () {
  const intl = createIntl({
    locale: 'en',
  });
  intl.__addMessages({
    foo: 'bar',
  });
  expect(
    intl.formatMessage({
      id: 'foo',
    })
  ).toBe('bar');
});
