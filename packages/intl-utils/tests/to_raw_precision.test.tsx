import {toRawPrecision} from '../src';

test('toRawPrecision(9.99, 1, 2)', () => {
  expect(toRawPrecision(9.99, 1, 2)).toEqual({
    formattedString: '10',
    roundedNumber: 10,
    integerDigitsCount: 2,
  });
});

test('toRawPrecision(1e15, 1, 21)', () => {
  expect(toRawPrecision(1e15, 1, 21)).toEqual({
    formattedString: '1000000000000000',
    roundedNumber: 1e15,
    integerDigitsCount: 16,
  });
});
