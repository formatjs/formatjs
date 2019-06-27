import IntlRelativeTimeFormat from './core';
import defaultLocale from './en';

IntlRelativeTimeFormat.__addLocaleData(defaultLocale);
export * from './core';
export * from './types';
export default IntlRelativeTimeFormat;
