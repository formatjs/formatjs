// Temporal captures DateTimeFormat before native extensions are installed.
Intl.DateTimeFormat = function DeferredDateTimeFormat(locales, options) {
  return new Intl.DateTimeFormat(locales, options)
}
