import {pegParse} from '../src/parser';

test('unescaped string literals', () => {
  expect(pegParse('}')).toMatchSnapshot();
  expect(pegParse('line1\n  line2')).toMatchSnapshot();
});

test('treats double apostrophes as one apostrophe', () => {
  expect(pegParse(`a''b`)).toMatchSnapshot();
});

test('starts quoted text if apostrophe immediately precedes a character', () => {
  expect(pegParse(`'{a''b}'`)).toMatchSnapshot();
  expect(pegParse(`'}a''b{'`)).toMatchSnapshot();
  expect(pegParse(`aaa'{'`)).toMatchSnapshot();
  expect(pegParse(`aaa'}'`)).toMatchSnapshot();
});

test('does not start quoted text if apostrophe does not immediately precede a character', () => {
  expect(pegParse(`'aa''b'`)).toMatchSnapshot();
  expect(pegParse(`I don't know`)).toMatchSnapshot();
});

test('apostrophe quote can be unclosed', () => {
  // Substring starting at th apostrophe are all escaped because the quote did not close
  expect(pegParse(`a '{a{ {}{}{} ''bb`)).toMatchSnapshot();
  // The apostrophe here does not start a quote because it is not followed by `{` or `}`,
  // so the `{}` is invalid syntax.
  expect(() => pegParse(`a 'a {}{}`)).toThrow();
  // The last apostrophe ends the escaping, therefore the last `{}` is invalid syntax.
  expect(() => pegParse(`a '{a{ {}{}{}}}''' \n {}`)).toThrow();
  expect(pegParse("You have '{count'")).toMatchSnapshot();
  expect(pegParse("You have '{count")).toMatchSnapshot();
  expect(pegParse("You have '{count}")).toMatchSnapshot();
  expect(
    pegParse(
      "You {count, plural, one {worked for '#' hour} other {worked for '#' hours}} today."
    )
  ).toMatchSnapshot();
  expect(
    // '# hour} other {worked for ' is quoted.
    pegParse(
      "You {count, plural, one {worked for '# hour} other {worked for '# hours}} today."
    )
  ).toMatchSnapshot();
});
