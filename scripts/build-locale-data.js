import * as fs from 'fs';
import * as p from 'path';
import {Readable} from 'stream';
import {sync as mkdirpSync} from 'mkdirp';
import extractCLDRData from 'formatjs-extract-cldr-data';
import serialize from 'serialize-javascript';
import browserify from 'browserify';
import uglifyify from 'uglifyify';

const DEFAULT_LOCALE = 'en';

const cldrData = extractCLDRData({
    pluralRules   : true,
    relativeFields: true,
});

const cldrDataByLocale = new Map(
    Object.keys(cldrData).map((locale) => [locale, cldrData[locale]])
);

const cldrDataByLang = [...cldrDataByLocale].reduce((map, [locale, data]) => {
    let [lang]   = locale.split('-');
    let langData = map.get(lang) || [];
    return map.set(lang, langData.concat(data));
}, new Map());

function createDataModule(localeData) {
    let serializedLocaleData = serialize(localeData);

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

function writeUMDFile(filename, code) {
    let lang        = p.basename(filename, '.js');
    let readStream  = new Readable();
    let writeStream = fs.createWriteStream(filename);

    browserify({standalone: `ReactIntlLocaleData.${lang}`})
        .add(readStream)
        .transform(uglifyify)
        .bundle()
        .on('error', throwIfError)
        .pipe(writeStream);

    readStream.push(code, 'utf8');
    readStream.push(null);
}

function throwIfError(error) {
    if (error) {
        throw error;
    }
}

// -----------------------------------------------------------------------------

mkdirpSync('src/locale-data/');
mkdirpSync('lib/locale-data/');
mkdirpSync('dist/locale-data/');

fs.writeFile('src/en.js',
    createDataModule(cldrDataByLocale.get(DEFAULT_LOCALE)).es6,
    throwIfError
);

let allData = createDataModule([...cldrDataByLocale.values()]);
fs.writeFile('src/locale-data/index.js', allData.es6, throwIfError);
fs.writeFile('lib/locale-data/index.js', allData.commonjs, throwIfError);
writeUMDFile('dist/locale-data/index.js', allData.commonjs);

cldrDataByLang.forEach((cldrData, lang) => {
    let data = createDataModule(cldrData);
    fs.writeFile(`src/locale-data/${lang}.js`, data.es6, throwIfError);
    fs.writeFile(`lib/locale-data/${lang}.js`, data.commonjs, throwIfError);
    writeUMDFile(`dist/locale-data/${lang}.js`, data.commonjs);
});
