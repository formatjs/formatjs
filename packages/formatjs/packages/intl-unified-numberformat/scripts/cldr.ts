import {extractAllUnits, getAllLanguages} from 'formatjs-extract-cldr-data';
import {SANCTIONED_UNITS} from '@formatjs/intl-utils';
import {resolve, join} from 'path';
import {outputFileSync, outputJSONSync} from 'fs-extra';

const unitData = extractAllUnits();

function shortenUnit(unit: string) {
  return unit.replace(/^(.*?)-/, '');
}

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

const sanctionedUnitData: Record<string, any> = {};

Object.keys(unitData).map(locale => {
  const lang = locale.split('-')[0];

  const datum = unitData[locale];
  const availableUnits = Object.keys(datum);
  if (availableUnits.length) {
    if (!sanctionedUnitData[lang]) {
      sanctionedUnitData[lang] = [];
    }
    sanctionedUnitData[lang].push({
      locale,
      units: availableUnits.reduce((all: Record<string, any>, unit) => {
        all[shortenUnit(unit)] = datum[unit];
        return all;
      }, {}),
    });
  }
});

const absoluteLocaleFiles = Object.keys(sanctionedUnitData).map(lang =>
  join(allLocaleDistDir, lang + '.json')
);

Object.keys(sanctionedUnitData).forEach((lang, i) => {
  outputJSONSync(absoluteLocaleFiles[i], sanctionedUnitData[lang]);
});

outputFileSync(
  resolve(__dirname, '../src/units-constants.ts'),
  `/* @generated */
// prettier-ignore
export type Unit = 
  ${SANCTIONED_UNITS.map(unit => `'${shortenUnit(unit)}'`).join(' | ')}
`
);

// Extract src/en.ts
outputFileSync(
  resolve(__dirname, '../src/en.ts'),
  `/* @generated */
// prettier-ignore
import {LocaleData} from './core';
const data: LocaleData[] = ${JSON.stringify(sanctionedUnitData.en)};
export default data;
`
);

// Aggregate all into src/locales.ts
outputFileSync(
  resolve(__dirname, '../src/locales.ts'),
  `/* @generated */
// prettier-ignore
import {UnifiedNumberFormat, isUnitSupported} from './core';
${Object.keys(sanctionedUnitData)
  .map(
    (lang, i) =>
      `UnifiedNumberFormat.__addUnitLocaleData(${JSON.stringify(
        sanctionedUnitData[lang]
      )});`
  )
  .join('\n')}
if (!isUnitSupported('bit')) {
  Intl.NumberFormat = UnifiedNumberFormat as any;
}
`
);
