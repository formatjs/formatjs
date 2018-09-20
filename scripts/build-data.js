import * as fs from 'fs';
import * as p from 'path';
import {sync as mkdirpSync} from 'mkdirp';
import extractCLDRData from 'formatjs-extract-cldr-data';
import serialize from 'serialize-javascript';
import {rollup} from 'rollup';
import memory from 'rollup-plugin-memory';
import uglify from 'rollup-plugin-uglify';

const DEFAULT_LOCALE = 'en';

const cldrData = extractCLDRData({
  pluralRules: true,
  relativeFields: true,
});

const cldrDataByLocale = new Map(
  Object.keys(cldrData).map(locale => [locale, cldrData[locale]])
);

const cldrDataByLang = [...cldrDataByLocale].reduce((map, [locale, data]) => {
  const [lang] = locale.split('-');
  const langData = map.get(lang) || [];
  return map.set(lang, langData.concat(data));
}, new Map());

function createDataModule(localeData) {
  return `// GENERATED FILE
export default ${serialize(localeData)};
`;
}

function writeUMDFile(filename, module) {
  const lang = p.basename(filename, '.js');

  return rollup({
    input: filename,
    plugins: [
      memory({
        path: filename,
        contents: module,
      }),
      uglify(),
    ],
  })
    .then(bundle => {
      return bundle.write({
        file: filename,
        format: 'umd',
        name: `ReactIntlLocaleData.${lang}`,
      });
    })
    .then(() => filename);
}

function writeFile(filename, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, contents, err => {
      if (err) {
        reject(err);
      } else {
        resolve(p.resolve(filename));
      }
    });
  });
}

// -----------------------------------------------------------------------------

mkdirpSync('locale-data/');

const defaultData = createDataModule(cldrDataByLocale.get(DEFAULT_LOCALE));
writeFile(`src/${DEFAULT_LOCALE}.js`, defaultData);

const allData = createDataModule([...cldrDataByLocale.values()]);
writeUMDFile('locale-data/index.js', allData);

cldrDataByLang.forEach((cldrData, lang) => {
  writeUMDFile(`locale-data/${lang}.js`, createDataModule(cldrData));
});

process.on('unhandledRejection', reason => {
  throw reason;
});
console.log('> Writing locale data files...');
