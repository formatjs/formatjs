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

test('__addMessages', function () {
  const intl = createIntl({
    locale: 'en',
    messages: {},
  });
  expect(intl.messages).toEqual({});
  intl.__addMessages({foo: ''});
  expect(intl.messages).toEqual({foo: ''});
});
