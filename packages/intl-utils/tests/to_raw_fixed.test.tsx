import {toRawFixed} from '../src';

test('toRawFixed(9.99, 0, 1)', () => {
  expect(toRawFixed(9.99, 0, 1)).toEqual({
    formattedString: '10',
    roundedNumber: 10,
    integerDigitsCount: 2,
  });
});

test('toRawFixed(1e41, 0, 3)', () => {
  expect(toRawFixed(1e41, 0, 3)).toEqual({
    formattedString: '100000000000000000000000000000000000000000',
    roundedNumber: 1e41,
    integerDigitsCount: 42,
  });
});

test('toRawFixed(1e-10, 1, 21)', () => {
  expect(toRawFixed(1e-10, 1, 21)).toEqual({
    formattedString: '0.0000000001',
    roundedNumber: 1e-10,
    integerDigitsCount: 1,
  });
});

test('Rounding: toRawFixed(123.445, 0, 2)', () => {
  expect(toRawFixed(123.445, 0, 2)).toEqual({
    formattedString: '123.45',
    roundedNumber: 123.45,
    integerDigitsCount: 3,
  });
});
