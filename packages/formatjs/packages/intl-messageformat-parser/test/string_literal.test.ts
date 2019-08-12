import {parse} from '../src/parser';

test('unescaped string literals', () => {
  expect(parse('line1\n  line2')).toMatchSnapshot();
});

test('treats double apostrophes as one apostrophe', () => {
  expect(parse(`a''b`)).toMatchSnapshot();
});

test('starts quoted text if apostrophe immediately precedes a character', () => {
  expect(parse(`'{a''b}'`)).toMatchSnapshot();
  expect(parse(`'}a''b{'`)).toMatchSnapshot();
  expect(parse(`aaa'{'`)).toMatchSnapshot();
  expect(parse(`aaa'}'`)).toMatchSnapshot();
});

test('does not start quoted text if apostrophe does not immediately precede a character', () => {
  expect(parse(`'aa''b'`)).toMatchSnapshot();
  expect(parse(`I don't know`)).toMatchSnapshot();
});
