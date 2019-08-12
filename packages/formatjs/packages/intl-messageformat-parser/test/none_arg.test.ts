import {parse} from '../src/parser';

test('trivial', () => {
  expect(parse('{0}')).toMatchSnapshot();
  expect(parse('{arg}')).toMatchSnapshot();
  expect(parse('hello {name}')).toMatchSnapshot();
});
