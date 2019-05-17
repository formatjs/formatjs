const extractData = require("formatjs-extract-cldr-data");
const { resolve, join } = require("path");
const { outputFileSync } = require("fs-extra");
const serialize = require("serialize-javascript");

const data = extractData();

function serializeEntry(entry, wrapFn) {
  var serialized = serialize(entry);

  if (typeof wrapFn === "function") {
    return wrapFn(serialized);
  }

  return serialized;
}

function extractLocales(wrapFn, locales) {
  return Object.keys(data).reduce(function(files, locale) {
    if (!Array.isArray(locales) || locales.includes(locale)) {
      var lang = locale.split("-")[0];
      files[lang] = (files[lang] || "") + serializeEntry(data[locale], wrapFn);
    }
    return files;
  }, {});
}

const allLocaleDistDir = resolve(__dirname, "../dist/locale-data");

// Dist all locale files to dist/locale-data
const allLocaleFiles = extractLocales(function(entry) {
  return "IntlMessageFormat.__addLocaleData(" + entry + ");\n";
});
Object.keys(allLocaleFiles).forEach(function(lang) {
  const destFile = join(allLocaleDistDir, lang + ".js");
  outputFileSync(
    destFile,
    `/* @generated */
${allLocaleFiles[lang]}`
  );
});

// Aggregate all into lib/locales.js
outputFileSync(
  resolve(__dirname, "../lib/locales.js"),
  `/* @generated */
var IntlMessageFormat = require("./core")["default"];\n
${Object.keys(allLocaleFiles)
  .map(lang => allLocaleFiles[lang])
  .join("\n")}`
);

// Extract src/en.js
const en = extractLocales(undefined, ["en"]);
outputFileSync(
  resolve(__dirname, "../src/en.js"),
  `/* @generated */
export default ${en.en};
`
);
