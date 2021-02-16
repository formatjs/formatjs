import {createIntl} from '../src/create-intl';

test('createIntl', function () {
  const intl = createIntl({
    locale: 'en',
    messages: {
      foo: 'bar',
    },
  });
  expect(
    intl.formatMessage({
      id: 'foo',
    })
  ).toBe('bar');
});

test('verify config', function () {
  const warnFn = jest.spyOn(console, 'warn');
  expect(warnFn).not.toHaveBeenCalled();
  createIntl({
    locale: 'en',
    messages: {},
    defaultRichTextElements: {},
  });
  expect(warnFn).not.toHaveBeenCalled();
});
