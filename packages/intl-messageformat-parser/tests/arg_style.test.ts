import {pegParse} from '../src/parser';
import {printAST} from '../src/printer';

test.each([
  `{0,date,y-M-d HH:mm:ss}`,
  `{0,number,y-M-d HH:mm:ss}`,
  `{0,date,y-M-d HH:mm:ss zzzz}`,
  `{0,number,y-M-d HH:mm:ss zzzz}`,
  `{0,date,y-M-d,HH:mm:ss,zzzz}`,
  `{0,number,y-M-d,HH:mm:ss,zzzz}`,
  `{0,number,'{}'}`,
  `{0,number,''}`,
])('argStyleText test case: %p', testCase => {
  const ast = pegParse(testCase);
  expect(ast).toMatchSnapshot();
  expect(printAST(ast)).toMatchSnapshot();
});
