import {pegParse} from '../src/parser';
import {printAST} from '../src/printer';
import {isNumberElement, TYPE, isNumberSkeleton} from '../src/types';
import {convertNumberSkeletonToNumberFormatOptions} from '../src/skeleton';

test.each([
  `compact-short currency/GBP`,
  `@@#`,
  `currency/CAD unit-width-narrow`,
])('case: %p', skeleton => {
  const ast = pegParse(`{0, number, ::${skeleton}}`);
  expect(ast).toMatchSnapshot();
  expect(printAST(ast)).toMatchSnapshot();
});

test.each([
  'percent .00/@##',
  'percent .00/@@@',
  'percent .00/@@@@+',
  'currency/CAD .',
  'currency/GBP .0+/@@@',
  'currency/GBP .00##/@@@',
])('[convertNumberSkeletonToNumberFormatOptions] case: %p', skeleton => {
  const ast = pegParse(`{0, number, ::${skeleton}}`);
  const el = ast[0];
  if (!isNumberElement(el)) {
    throw expect(el.type).toEqual(TYPE.number);
  }
  if (!isNumberSkeleton(el.style)) {
    throw 'element style should be parsed as number skeleton';
  }
  expect(
    convertNumberSkeletonToNumberFormatOptions(el.style.tokens)
  ).toMatchSnapshot();
});
