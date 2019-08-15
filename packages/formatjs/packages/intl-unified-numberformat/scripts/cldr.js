const { extractAllUnits } = require('formatjs-extract-cldr-data');
const { resolve, join } = require('path');
const { outputFileSync, outputJSONSync } = require('fs-extra');
const serialize = require('serialize-javascript');

const data = extractAllUnits();

const allUnits = Object.keys(data)

function extractLocales(locales, unitData) {
  return Object.keys(unitData).reduce(function (files, locale) {
    if (!Array.isArray(locales) || locales.includes(locale)) {
      var lang = locale.split('-')[0];
      if (!files[lang]) {
        files[lang] = [unitData[locale]];
      } else {
        files[lang].push(unitData[locale]);
      }
    }
    return files;
  }, {});
}

function shortenUnit(unit) {
  return unit.replace(/^(.*?)-/, '')
}

const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');

allUnits.forEach(unit => {
  // Dist all locale files to dist/locale-data	
  const allLocaleFiles = extractLocales(undefined, data[unit]);

  Object.keys(allLocaleFiles).map(lang => {
    outputJSONSync(join(allLocaleDistDir, unit, lang + '.json'), allLocaleFiles[lang]);
  });

})
outputFileSync(
  resolve(__dirname, '../src/units-constants.ts'),
  `/* @generated */
// prettier-ignore
export const enum Unit {
  ${
    allUnits
    .map(shortenUnit)
    .map(unit => `'${unit}' = '${unit}'`)
    .join(',\n')
  }
}`
)

//  // Aggregate all into src/locales.ts	
// outputFileSync(	
//   resolve(__dirname, '../src/locales.ts'),	
//   `/* @generated */	
// // prettier-ignore  
// import IntlRelativeTimeFormat from "./core";\n
// IntlRelativeTimeFormat.__addLocaleData(${Object.keys(allLocaleFiles)	
//   .map(lang => allLocaleFiles[lang])	
//   .join(',\n')});	
// export default IntlRelativeTimeFormat;	
//   `	
// );	

//  // Extract src/en.js	
// const en = extractLocales(['en']);	
// outputFileSync(	
//   resolve(__dirname, '../src/en.ts'),	
//   `/* @generated */	
// // prettier-ignore  
// export default ${en.en};	
// `	
// );