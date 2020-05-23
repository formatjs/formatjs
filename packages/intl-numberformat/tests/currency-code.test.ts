import {NumberFormat} from '../src';

NumberFormat.__addLocaleData(
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require(`../dist/locale-data/en.json`)
);

it('normalizes lower-cased currency code', () => {
  const lowerCaseNf = new NumberFormat('en', {
    style: 'currency',
    currency: 'usd',
  });
  const upperCaseNf = new NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
  });
  expect(lowerCaseNf.format(-1234)).toEqual(upperCaseNf.format(-1234));
});

it('rejects invalid currency code', () => {
  expect(() => {
    new NumberFormat('en', {style: 'currency', currency: '123'});
  }).toThrow(RangeError);
});
