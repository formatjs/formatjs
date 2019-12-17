import {sync as globSync} from 'glob';
import {resolve, dirname} from 'path';
import * as Numbers from 'cldr-numbers-full/main/en/numbers.json';

const numberDataFiles = globSync('*/numbers.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-numbers-full/package.json')),
    './main'
  ),
}).map(p => `cldr-numbers-full/main/${p}`);

const numbersData: Array<typeof Numbers> = numberDataFiles.map(p => require(p));

numbersData.forEach(d => {
  const locale = Object.keys(d.main)[0] as 'en';
  const data = d.main[locale].numbers;
  if (data['scientificFormats-numberSystem-latn'].standard !== '#E0') {
    console.log(
      `${locale} has uncommon (#E0) scientific format: ${data['scientificFormats-numberSystem-latn'].standard}`
    );
  }
  if (data['percentFormats-numberSystem-latn'].standard !== '#,##0%') {
    console.log(
      `${locale} has uncommon (#,##0%) percent format: ${data['percentFormats-numberSystem-latn'].standard}`
    );
  }
  if (
    data['currencyFormats-numberSystem-latn'].currencySpacing.afterCurrency
      .currencyMatch !== '[:^S:]'
  ) {
    console.log(
      `${locale} has uncommon ([:^S:]) currencySpacing: ${data['currencyFormats-numberSystem-latn'].currencySpacing.afterCurrency.currencyMatch}`
    );
  }
});
