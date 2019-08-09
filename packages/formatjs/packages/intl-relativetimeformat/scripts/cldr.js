const {default: extractData, processAliases } = require('formatjs-extract-cldr-data');	
const { resolve, join } = require('path');	
const { outputFileSync } = require('fs-extra');	
const serialize = require('serialize-javascript');	

 const data = extractData({
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
// prettier-ignore
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__addLocaleData === 'function') {
  Intl.RelativeTimeFormat.__addLocaleData(${allLocaleFiles[lang]})
}`	
  );	
});	

 // Aggregate all into src/locales.ts	
outputFileSync(	
  resolve(__dirname, '../src/locales.ts'),	
  `/* @generated */	
// prettier-ignore  
import IntlRelativeTimeFormat from "./core";\n
IntlRelativeTimeFormat.__addLocaleData(${Object.keys(allLocaleFiles)	
  .map(lang => allLocaleFiles[lang])	
  .join(',\n')});	
export default IntlRelativeTimeFormat;	
  `	
);	

 // Extract src/en.js	
const en = extractLocales(['en']);	
outputFileSync(	
  resolve(__dirname, '../src/en.ts'),	
  `/* @generated */	
// prettier-ignore  
export default ${en.en};	
`	
);

// Extract aliases
const aliases = processAliases()
outputFileSync(	
  resolve(__dirname, '../dist/aliases.js'),	
  `/* @generated */	
// prettier-ignore  
if (Intl.RelativeTimeFormat && typeof Intl.RelativeTimeFormat.__setLanguageAliases === 'function') {
  Intl.RelativeTimeFormat.__setLanguageAliases(${serialize(aliases)})
}
`	
);
outputFileSync(	
  resolve(__dirname, '../src/aliases.ts'),	
  `/* @generated */	
// prettier-ignore  
export default ${serialize(aliases)}
`
)