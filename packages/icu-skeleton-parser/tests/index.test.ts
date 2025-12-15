import {parseDateTimeSkeleton, parseNumberSkeleton} from '../index.js'
import {parseNumberSkeletonFromString} from '../number.js'
import {test, expect} from 'vitest'

const dateTimeSkeletonResults = {
  "yyyy.MM.dd G 'at' HH:mm:ss zzzz": {
    day: '2-digit',
    era: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZoneName: 'long',
    year: 'numeric',
  },
  "EEE, MMM d, ''yy": {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    year: '2-digit',
  },
  'EEEE, d MMMM yyyy': {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  },
  'h:mm a': {
    hour: 'numeric',
    hour12: true,
    hourCycle: 'h12',
    minute: '2-digit',
  },
  '': {},
}

test.each(Object.entries(dateTimeSkeletonResults))(
  'case: %s',
  (skeleton, expected) => {
    expect(parseDateTimeSkeleton(skeleton)).toEqual(expected)
  }
)

const numberSkeletonResults = {
  'percent .##': {
    maximumFractionDigits: 2,
    style: 'percent',
  },
  '.##': {
    maximumFractionDigits: 2,
  },
  '.##/w': {
    maximumFractionDigits: 2,
    trailingZeroDisplay: 'stripIfInteger',
  },
  '.': {
    maximumFractionDigits: 0,
  },
  '% .##': {
    maximumFractionDigits: 2,
    style: 'percent',
  },
  '.##/@##r': {
    maximumFractionDigits: 2,
    maximumSignificantDigits: 3,
    minimumSignificantDigits: 1,
    roundingPriority: 'morePrecision',
  },
  '.##/@##s': {
    maximumFractionDigits: 2,
    maximumSignificantDigits: 3,
    minimumSignificantDigits: 1,
    roundingPriority: 'lessPrecision',
  },
  '@ rounding-mode-floor': {
    maximumSignificantDigits: 1,
    minimumSignificantDigits: 1,
    roundingMode: 'floor',
  },
  'percent .000*': {
    minimumFractionDigits: 3,
    style: 'percent',
  },
  'percent .0###': {
    maximumFractionDigits: 4,
    minimumFractionDigits: 1,
    style: 'percent',
  },
  'percent .00/@##': {
    maximumFractionDigits: 2,
    maximumSignificantDigits: 3,
    minimumFractionDigits: 2,
    minimumSignificantDigits: 1,
    style: 'percent',
  },
  'percent .00/@@@': {
    maximumFractionDigits: 2,
    maximumSignificantDigits: 3,
    minimumFractionDigits: 2,
    minimumSignificantDigits: 3,
    style: 'percent',
  },
  'percent .00/@@@@*': {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'percent',
  },
  'percent scale/0.01': {
    scale: 0.01,
    style: 'percent',
  },
  'currency/CAD .': {
    currency: 'CAD',
    maximumFractionDigits: 0,
    style: 'currency',
  },
  '.00/w currency/CAD': {
    currency: 'CAD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
    trailingZeroDisplay: 'stripIfInteger',
  },
  'currency/GBP .0*/@@@': {
    currency: 'GBP',
    maximumSignificantDigits: 3,
    minimumFractionDigits: 1,
    minimumSignificantDigits: 3,
    style: 'currency',
  },
  'currency/GBP .00##/@@@': {
    currency: 'GBP',
    maximumFractionDigits: 4,
    maximumSignificantDigits: 3,
    minimumFractionDigits: 2,
    minimumSignificantDigits: 3,
    style: 'currency',
  },
  'currency/GBP .00##/@@@ unit-width-full-name': {
    currency: 'GBP',
    currencyDisplay: 'name',
    maximumFractionDigits: 4,
    maximumSignificantDigits: 3,
    minimumFractionDigits: 2,
    minimumSignificantDigits: 3,
    style: 'currency',
    unitDisplay: 'long',
  },
  'measure-unit/length-meter .00##/@@@': {
    maximumFractionDigits: 4,
    maximumSignificantDigits: 3,
    minimumFractionDigits: 2,
    minimumSignificantDigits: 3,
    style: 'unit',
    unit: 'meter',
  },
  'measure-unit/length-meter .00##/@@@ unit-width-full-name': {
    currencyDisplay: 'name',
    maximumFractionDigits: 4,
    maximumSignificantDigits: 3,
    minimumFractionDigits: 2,
    minimumSignificantDigits: 3,
    style: 'unit',
    unit: 'meter',
    unitDisplay: 'long',
  },
  'compact-short': {
    compactDisplay: 'short',
    notation: 'compact',
  },
  'compact-long': {
    compactDisplay: 'long',
    notation: 'compact',
  },
  scientific: {
    notation: 'scientific',
  },
  'scientific/sign-always': {
    notation: 'scientific',
    signDisplay: 'always',
  },
  'scientific/+ee/sign-always': {
    notation: 'scientific',
    signDisplay: 'always',
  },
  engineering: {
    notation: 'engineering',
  },
  'engineering/sign-except-zero': {
    notation: 'engineering',
    signDisplay: 'exceptZero',
  },
  'notation-simple': {
    notation: 'standard',
  },
  'sign-auto': {
    signDisplay: 'auto',
  },
  'sign-always': {
    signDisplay: 'always',
  },
  '+!': {
    signDisplay: 'always',
  },
  'sign-never': {
    signDisplay: 'never',
  },
  '+_': {
    signDisplay: 'never',
  },
  'sign-accounting': {
    currencySign: 'accounting',
  },
  '()': {
    currencySign: 'accounting',
  },
  'sign-accounting-always': {
    currencySign: 'accounting',
    signDisplay: 'always',
  },
  '()!': {
    currencySign: 'accounting',
    signDisplay: 'always',
  },
  'sign-except-zero': {
    signDisplay: 'exceptZero',
  },
  '+?': {
    signDisplay: 'exceptZero',
  },
  'sign-accounting-except-zero': {
    currencySign: 'accounting',
    signDisplay: 'exceptZero',
  },
  '()?': {
    currencySign: 'accounting',
    signDisplay: 'exceptZero',
  },
  '000': {
    minimumIntegerDigits: 3,
  },
  'integer-width/*000': {
    minimumIntegerDigits: 3,
  },
  E0: {
    minimumIntegerDigits: 1,
    notation: 'scientific',
  },
  'E+!00': {
    minimumIntegerDigits: 2,
    notation: 'scientific',
    signDisplay: 'always',
  },
  'EE+?000': {
    minimumIntegerDigits: 3,
    notation: 'engineering',
    signDisplay: 'exceptZero',
  },
  '%x100': {
    scale: 100,
    style: 'percent',
  },
}

test.each(Object.entries(numberSkeletonResults))(
  '[parseNumberSkeleton] case: %s',
  (skeleton, expected) => {
    expect(
      parseNumberSkeleton(parseNumberSkeletonFromString(skeleton))
    ).toEqual(expected)
  }
)
