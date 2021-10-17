import {parseDateTimeSkeleton, parseNumberSkeleton} from '..'
import {parseNumberSkeletonFromString} from '../number'

test.each([
  `yyyy.MM.dd G 'at' HH:mm:ss zzzz`,
  `EEE, MMM d, ''yy`,
  `h:mm a`,
  ``,
])('case: %p', skeleton => {
  expect(parseDateTimeSkeleton(skeleton)).toMatchSnapshot()
})

test.each([
  'percent .##',
  '.##',
  '.##/w',
  '.',
  '% .##',
  '.##/@##r',
  '.##/@##s',
  'percent .000*',
  'percent .0###',
  'percent .00/@##',
  'percent .00/@@@',
  'percent .00/@@@@*',
  'percent scale/0.01',
  'currency/CAD .',
  'currency/GBP .0*/@@@',
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
  '+!',
  'sign-never',
  '+_',
  'sign-accounting',
  '()',
  'sign-accounting-always',
  '()!',
  'sign-except-zero',
  '+?',
  'sign-accounting-except-zero',
  '()?',
  '000',
  'integer-width/*000',
  'E0',
  'E+!00',
  'EE+?000',
  '%x100',
])('[parseNumberSkeleton] case: %p', skeleton => {
  expect(
    parseNumberSkeleton(parseNumberSkeletonFromString(skeleton))
  ).toMatchSnapshot()
})
