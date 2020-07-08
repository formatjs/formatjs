import RelativeTimeFormat from './';
if (!('RelativeTimeFormat' in Intl)) {
  Object.defineProperty(Intl, 'RelativeTimeFormat', {
    value: RelativeTimeFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}
