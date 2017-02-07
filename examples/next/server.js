const IntlPolyfill = require('intl');
Intl.NumberFormat = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const {readFileSync} = require('fs');
const {createServer} = require('http');
const accepts = require('accepts');
const glob = require('glob');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
const languages = ['en-US', 'fr', 'en'];

const localeDataCache = new Map();
const getLocaleData = (locale) => {
  const lang = locale.split('-')[0];
  if (!localeDataCache.has(lang)) {
    const localeDataFile = require.resolve(`react-intl/locale-data/${lang}`);
    const localeData = readFileSync(localeDataFile, 'utf8');
    localeDataCache.set(lang, localeData);
  }
  return localeDataCache.get(lang);
};

const messagesCache = new Map();
const getMessages = (locale) => {
  const lang = locale.split('-')[0];
  if (!messagesCache.has(lang)) {
    const messages = glob.sync('./messages/**/*.json')
      .map((filename) => readFileSync(filename, 'utf8'))
      .map((file) => JSON.parse(file))
      .reduce((messages, descriptors) => {
        descriptors.forEach(({id, defaultMessage}) => {
          messages[id] = defaultMessage;
        });
        return messages;
      }, {});
    messagesCache.set(lang, messages);
  }
  return messagesCache.get(lang);
};

app.prepare().then(() => {
  createServer((req, res) => {
    const accept = accepts(req);
    const locale = accept.language(languages);
    req.locale = locale;
    req.localeData = getLocaleData(locale);
    req.messages = getMessages(locale);
    handle(req, res);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Read on http://localhost:3000');
  });
});
