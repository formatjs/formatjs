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
  'currency/GBP .00##/@@@ unit-width-full-name',
  'measure-unit/length-meter .00##/@@@',
  'measure-unit/length-meter .00##/@@@ unit-width-full-name',
  'compact-short',
  'compact-long',
  'scientific',
  'scientific/sign-always',
  'scientific/+ee/sign-always',
  'engineering',
  'engineering/sign-except-zero',
  'notation-simple',
  'sign-auto',
  'sign-always',
  'sign-never',
  'sign-accounting',
  'sign-accounting-always',
  'sign-except-zero',
  'sign-accounting-except-zero',
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
