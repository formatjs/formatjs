import {pegParse} from '../src/parser';

test('trivial', () => {
  expect(pegParse('{0}')).toMatchSnapshot();
  expect(pegParse('{arg}')).toMatchSnapshot();
  expect(pegParse('hello {name}')).toMatchSnapshot();
});
