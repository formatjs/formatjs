import {pegParse} from '../src/parser';
import {printAST} from '../src/printer';

test.each([
  `compact-short currency/GBP`,
  `@@#`,
  `currency/CAD unit-width-narrow`,
])('case: %p', skeleton => {
  const ast = pegParse(`{0, number, ::${skeleton}}`);
  expect(ast).toMatchSnapshot();
  expect(printAST(ast)).toMatchSnapshot();
});
