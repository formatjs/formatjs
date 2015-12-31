import * as fs from 'fs';
import * as p from 'path';
import {sync as mkdirpSync} from 'mkdirp';
import extractCLDRData from 'formatjs-extract-cldr-data';
import serialize from 'serialize-javascript';
import rollup from 'rollup';
import uglify from 'uglify-js';

const DEFAULT_LOCALE = 'en';

const cldrData = extractCLDRData({
    pluralRules   : true,
    relativeFields: true,
});

const cldrDataByLocale = new Map(
    Object.keys(cldrData).map((locale) => [locale, cldrData[locale]])
);

const cldrDataByLang = [...cldrDataByLocale].reduce((map, [locale, data]) => {
    const [lang]   = locale.split('-');
    const langData = map.get(lang) || [];
    return map.set(lang, langData.concat(data));
}, new Map());

function createDataModule(localeData) {
    const serializedLocaleData = serialize(localeData);

    return {
        es6: (
`// GENERATED FILE
export default ${serializedLocaleData};
`
        ),

        commonjs: (
`// GENERATED FILE
module.exports = ${serializedLocaleData};
`
        ),
    };
}

function generateUMDFile(srcFilename) {
    const lang = p.basename(srcFilename, '.js');

    return rollup.rollup({
        entry: srcFilename,
    })
    .then((bundle) => {
        return bundle.generate({
            format    : 'umd',
            moduleName: `ReactIntlLocaleData.${lang}`,
        });
    })
    .then(({code}) => {
        return uglify.minify(code, {
            fromString: true,
            warnings  : false,
        }).code;
    });
}

function writeFile(filename, contents) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, contents, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(p.resolve(filename));
            }
        });
    });
}

// -----------------------------------------------------------------------------

process.on('unhandledRejection', (reason) => {throw reason;});

mkdirpSync('src/locale-data/');
mkdirpSync('lib/locale-data/');
mkdirpSync('dist/locale-data/');

const defaultData = createDataModule(cldrDataByLocale.get(DEFAULT_LOCALE));
writeFile(`src/${DEFAULT_LOCALE}.js`, defaultData.es6);

const allData = createDataModule([...cldrDataByLocale.values()]);
writeFile('lib/locale-data/index.js', allData.commonjs);
writeFile('src/locale-data/index.js', allData.es6)
    .then(generateUMDFile)
    .then((umdFile) => {
        writeFile('dist/locale-data/index.js', umdFile);
    });

cldrDataByLang.forEach((cldrData, lang) => {
    const data = createDataModule(cldrData);
    writeFile(`lib/locale-data/${lang}.js`, data.commonjs);
    writeFile(`src/locale-data/${lang}.js`, data.es6)
        .then(generateUMDFile)
        .then((umdFile) => {
            writeFile(`dist/locale-data/${lang}.js`, umdFile);
        });
});

console.log('Writing locale data files...');
