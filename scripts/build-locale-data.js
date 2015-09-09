import * as fs from 'fs';
import {sync as mkdirpSync} from 'mkdirp';
import extractCLDRData from 'formatjs-extract-cldr-data';
import serialize from 'serialize-javascript';

const DEFAULT_LOCALE = 'en';

const cldrData = extractCLDRData({
    pluralRules   : true,
    relativeFields: true,
});

const dataByLocale = new Map(
    Object.keys(cldrData).map((locale) => [locale, cldrData[locale]])
);

const dataByLang = [...dataByLocale].reduce((map, [locale, data]) => {
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

function createDistDataScript(localeData) {
    return (
`// GENERATED FILE
ReactIntl.addLocaleData(${serialize(localeData)});
`
    );
}

// -----------------------------------------------------------------------------

mkdirpSync('src/locale-data/');
mkdirpSync('dist/locale-data/');

fs.writeFileSync('src/en.js',
    createDataModule(dataByLocale.get(DEFAULT_LOCALE))
);

fs.writeFileSync('src/locale-data/index.js',
    createDataModule([...dataByLocale.values()])
);

dataByLang.forEach((data, lang) => {
    fs.writeFileSync(`src/locale-data/${lang}.js`, createDataModule(data));
    fs.writeFileSync(`dist/locale-data/${lang}.js`, createDistDataScript(data));
});
