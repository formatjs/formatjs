import {toRawPrecision} from '../src';

test('toRawPrecision(9.99, 1, 2)', () => {
  expect(toRawPrecision(9.99, 1, 2)).toEqual({
    formattedString: '10',
    roundedNumber: 10,
    integerDigitsCount: 2,
  });
});

test('toRawPrecision(1e41, 1, 21)', () => {
  expect(toRawPrecision(1e41, 1, 21)).toEqual({
    formattedString: '100000000000000000000000000000000000000000',
    roundedNumber: 1e41,
    integerDigitsCount: 42,
  });
});

test('toRawPrecison(1e-10, 1, 21)', () => {
  expect(toRawPrecision(1e-10, 1, 21)).toEqual({
    formattedString: '0.0000000001',
    roundedNumber: 1e-10,
    integerDigitsCount: 1,
  });
});

test('toRawPrecision(1e21, 1, 10)', () => {
  expect(toRawPrecision(1e21, 1, 10)).toEqual({
    formattedString: '1000000000000000000000',
    roundedNumber: 1e21,
    integerDigitsCount: 22,
  });
});

test('Rounding: toRawPrecision(123.445, 3, 5)', () => {
  expect(toRawPrecision(123.445, 3, 5)).toEqual({
    formattedString: '123.45',
    roundedNumber: 123.45,
    integerDigitsCount: 3,
  });
});
