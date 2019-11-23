import {pegParse} from '../src/parser';

test('unescaped string literals', () => {
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
