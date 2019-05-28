const extractData = require('formatjs-extract-cldr-data');	
const { resolve, join } = require('path');	
const { outputFileSync } = require('fs-extra');	
const serialize = require('serialize-javascript');	

 const data = extractData({
  pluralRules   : true,
  relativeFields: true,
 });	

 function extractLocales(locales) {	
  return Object.keys(data).reduce(function(files, locale) {	
    if (!Array.isArray(locales) || locales.includes(locale)) {	
      var lang = locale.split('-')[0];	
      if (!files[lang]) {	
        files[lang] = serialize(data[locale]);	
      } else {	
        files[lang] += ',' + serialize(data[locale]);	
      }	
    }	
    return files;	
  }, {});	
}	

 const allLocaleDistDir = resolve(__dirname, '../dist/locale-data');	

 // Dist all locale files to dist/locale-data	
const allLocaleFiles = extractLocales();	
Object.keys(allLocaleFiles).forEach(function(lang) {	
  const destFile = join(allLocaleDistDir, lang + '.js');	
  outputFileSync(	
    destFile,	
    `/* @generated */	
IntlRelativeFormat.__addLocaleData(${allLocaleFiles[lang]})`	
  );	
});	

 // Aggregate all into lib/locales.js	
outputFileSync(	
  resolve(__dirname, '../src/locales.js'),	
  `/* @generated */	
import IntlRelativeFormat from "./core";\n
IntlRelativeFormat.__addLocaleData(${Object.keys(allLocaleFiles)	
  .map(lang => allLocaleFiles[lang])	
  .join(',\n')});	
export default IntlRelativeFormat;	
  `	
);	

 // Extract src/en.js	
const en = extractLocales(['en']);	
outputFileSync(	
  resolve(__dirname, '../src/en.js'),	
  `/* @generated */	
export default ${en.en};	
`	
);