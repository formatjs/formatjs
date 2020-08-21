import {ToRawPrecision} from '../src/NumberFormat/ToRawPrecision';

it('ToRawPrecision(9.99, 1, 2)', () => {
  expect(ToRawPrecision(9.99, 1, 2)).toEqual({
    formattedString: '10',
    roundedNumber: 10,
    integerDigitsCount: 2,
  });
});

it('ToRawPrecision(9.95, 1, 2)', () => {
  expect(ToRawPrecision(9.95, 1, 2)).toEqual({
    formattedString: '10',
    roundedNumber: 10,
    integerDigitsCount: 2,
  });
});

it('ToRawPrecision(9.94, 1, 2)', () => {
  expect(ToRawPrecision(9.94, 1, 2)).toEqual({
    formattedString: '9.9',
    roundedNumber: 9.9,
    integerDigitsCount: 1,
  });
});

it('ToRawPrecision(1e41, 1, 21)', () => {
  expect(ToRawPrecision(1e41, 1, 21)).toEqual({
    formattedString: '100000000000000000000000000000000000000000',
    roundedNumber: 1e41,
    integerDigitsCount: 42,
  });
});

it('toRawPrecison(1e-10, 1, 21)', () => {
  expect(ToRawPrecision(1e-10, 1, 21)).toEqual({
    formattedString: '0.0000000001',
    roundedNumber: 1e-10,
    integerDigitsCount: 1,
  });
});

it('ToRawPrecision(1e21, 1, 10)', () => {
  expect(ToRawPrecision(1e21, 1, 10)).toEqual({
    formattedString: '1000000000000000000000',
    roundedNumber: 1e21,
    integerDigitsCount: 22,
  });
});

it('Rounding: ToRawPrecision(123.445, 3, 5)', () => {
  expect(ToRawPrecision(123.445, 3, 5)).toEqual({
    formattedString: '123.45',
    roundedNumber: 123.45,
    integerDigitsCount: 3,
  });
});

it('ToRawPrecision(1.1, 3, 5)', () => {
  expect(ToRawPrecision(1.1, 3, 5)).toEqual({
    formattedString: '1.10',
    roundedNumber: 1.1,
    integerDigitsCount: 1,
  });
});
