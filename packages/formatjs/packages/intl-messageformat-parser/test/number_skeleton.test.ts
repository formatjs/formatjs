import { parse } from '../src/parser';

test.each([
  `compact-short currency/GBP`,
  `@@#`,
  `currency/CAD unit-width-narrow`
])('case: %p', skeleton => {
  expect(parse(`{0, number, ::${skeleton}}`)).toMatchSnapshot();
});
