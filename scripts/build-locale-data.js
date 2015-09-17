import * as fs from 'fs';
import {sync as mkdirpSync} from 'mkdirp';
import extractCLDRData from 'formatjs-extract-cldr-data';
import serialize from 'serialize-javascript';
import {transform} from 'babel';
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
    return (
`// GENERATED FILE
export default ${serialize(localeData)};
`
    );
}

function throwIfError(error) {
    if (error) {
        throw error;
    }
}

// -----------------------------------------------------------------------------

mkdirpSync('dist/locale-data/');
mkdirpSync('lib/locale-data/');
mkdirpSync('src/locale-data/');

fs.writeFile('src/en.js',
    createDataModule(cldrDataByLocale.get(DEFAULT_LOCALE)),
    throwIfError
);

let allData = createDataModule([...cldrDataByLocale.values()]);
fs.writeFile('src/locale-data/index.js', allData, throwIfError);
fs.writeFile('lib/locale-data/index.js', transform(allData).code, throwIfError);

cldrDataByLang.forEach((cldrData, lang) => {
    let data = createDataModule(cldrData);

    fs.writeFile(`src/locale-data/${lang}.js`, data, throwIfError);
    fs.writeFile(`lib/locale-data/${lang}.js`, transform(data).code, (err) => {
        throwIfError(err);

        browserify({standalone: `ReactIntlLocaleData.${lang}`})
            .add(`lib/locale-data/${lang}.js`)
            .transform(uglifyify)
            .bundle()
            .on('error', throwIfError)
            .pipe(fs.createWriteStream(`dist/locale-data/${lang}.js`));
    });
});
