import '@formatjs/intl-getcanonicallocales/polyfill';
import {NumberFormat} from '../';
import * as en from '../tests-locale-data/en.json';
NumberFormat.__addLocaleData(en as any);

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
