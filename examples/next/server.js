const IntlPolyfill = require('intl');
Intl.NumberFormat = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const {readFileSync} = require('fs');
const {basename} = require('path');
const {createServer} = require('http');

const accepts = require('accepts');
const glob = require('glob');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
const languages = glob.sync('./lang/*.json').map((f) => basename(f, '.json'));

const localeDataCache = new Map();
const getLocaleDataScript = (locale) => {
  const lang = locale.split('-')[0];
  if (!localeDataCache.has(lang)) {
    const localeDataFile = require.resolve(`react-intl/locale-data/${lang}`);
    const localeDataScript = readFileSync(localeDataFile, 'utf8');
    localeDataCache.set(lang, localeDataScript);
  }
  return localeDataCache.get(lang);
};

const messagesCache = new Map();
const getMessages = (locale) => {
  const lang = locale.split('-')[0];
  if (!messagesCache.has(lang)) {
    const messages = Object.assign({},
      require(`./lang/en.json`),
      require(`./lang/${lang}.json`)
    );
    messagesCache.set(lang, messages);
  }
  return messagesCache.get(lang);
};

app.prepare().then(() => {
  createServer((req, res) => {
    const accept = accepts(req);
    const locale = accept.language(languages);
    req.locale = locale;
    req.localeDataScript = getLocaleDataScript(locale);
    req.messages = dev ? {} : getMessages(locale);
    req.now = Date.now();
    handle(req, res);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Read on http://localhost:3000');
  });
});
