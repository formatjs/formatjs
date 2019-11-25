import {pegParse} from '../src/parser';
import {printAST} from '../src/printer';
import {parseDateTimeSkeleton} from '../src/skeleton';

test.each([
  `yyyy.MM.dd G 'at' HH:mm:ss vvvv`,
  `EEE, MMM d, ''yy`,
  `h:mm a`,
  ``,
])('case: %p', skeleton => {
  const ast = pegParse(`{0, date, ::${skeleton}}`);
  expect(ast).toMatchSnapshot();
  expect(printAST(ast)).toMatchSnapshot();
});

test.each([
  `yyyy.MM.dd G 'at' HH:mm:ss zzzz`,
  `EEE, MMM d, ''yy`,
  `h:mm a`,
  ``,
])('case: %p', skeleton => {
  expect(parseDateTimeSkeleton(skeleton)).toMatchSnapshot();
});
