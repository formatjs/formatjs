import ListFormat from './core';
if (!('ListFormat' in Intl)) {
  Object.defineProperty(Intl, 'ListFormat', {
    value: ListFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
