import * as fs from 'fs';
import * as p from 'path';
import {sync as mkdirpSync} from 'mkdirp';
import extractCLDRData from 'formatjs-extract-cldr-data';
import serialize from 'serialize-javascript';
import {rollup} from 'rollup';
import virtual from 'rollup-plugin-virtual';
import ProgressBar from 'progress';
import PromiseQueue from 'promise-queue';

const DEFAULT_LOCALE = 'en';
const CONCURRENCY = require('os').cpus().length - 1;

const cldrData = extractCLDRData({
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
      virtual({
        [filename]: module,
      }),
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

console.log('Building locale data...');

const progressBar = new ProgressBar(':percent [:bar] eta. :etas', {
  callback: () => console.log('...done!'),
  clear: true,
  total: cldrDataByLang.size + 2,
});

const defaultData = createDataModule(cldrDataByLocale.get(DEFAULT_LOCALE));
writeFile(`src/${DEFAULT_LOCALE}.js`, defaultData).then(() =>
  progressBar.tick()
);

const allData = createDataModule([...cldrDataByLocale.values()]);
writeUMDFile('locale-data/index.js', allData).then(() => progressBar.tick());

const promiseQueue = new PromiseQueue(CONCURRENCY, Infinity);

cldrDataByLang.forEach((cldrData, lang) => {
  promiseQueue.add(() =>
    writeUMDFile(`locale-data/${lang}.js`, createDataModule(cldrData)).then(
      () => progressBar.tick()
    )
  );
});

process.on('unhandledRejection', reason => {
  throw reason;
});
