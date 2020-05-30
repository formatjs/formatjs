import {toRawPrecision} from '../src';

it('toRawPrecision(9.99, 1, 2)', () => {
  expect(toRawPrecision(9.99, 1, 2)).toEqual({
    formattedString: '10',
    roundedNumber: 10,
    integerDigitsCount: 2,
  });
});

it('toRawPrecision(9.95, 1, 2)', () => {
  expect(toRawPrecision(9.95, 1, 2)).toEqual({
    formattedString: '10',
    roundedNumber: 10,
    integerDigitsCount: 2,
  });
});

it('toRawPrecision(9.94, 1, 2)', () => {
  expect(toRawPrecision(9.94, 1, 2)).toEqual({
    formattedString: '9.9',
    roundedNumber: 9.9,
    integerDigitsCount: 1,
  });
});

it('toRawPrecision(1e41, 1, 21)', () => {
  expect(toRawPrecision(1e41, 1, 21)).toEqual({
    formattedString: '100000000000000000000000000000000000000000',
    roundedNumber: 1e41,
    integerDigitsCount: 42,
  });
});

it('toRawPrecison(1e-10, 1, 21)', () => {
  expect(toRawPrecision(1e-10, 1, 21)).toEqual({
    formattedString: '0.0000000001',
    roundedNumber: 1e-10,
    integerDigitsCount: 1,
  });
});

it('toRawPrecision(1e21, 1, 10)', () => {
  expect(toRawPrecision(1e21, 1, 10)).toEqual({
    formattedString: '1000000000000000000000',
    roundedNumber: 1e21,
    integerDigitsCount: 22,
  });
});

it('Rounding: toRawPrecision(123.445, 3, 5)', () => {
  expect(toRawPrecision(123.445, 3, 5)).toEqual({
    formattedString: '123.45',
    roundedNumber: 123.45,
    integerDigitsCount: 3,
  });
});

it('toRawPrecision(1.1, 3, 5)', () => {
  expect(toRawPrecision(1.1, 3, 5)).toEqual({
    formattedString: '1.10',
    roundedNumber: 1.1,
    integerDigitsCount: 1,
  });
});
