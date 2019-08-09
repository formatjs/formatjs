import polyfill from './polyfill';
import RelativeTimeFormatWithLocales from './locales';
import aliases from './aliases';
RelativeTimeFormatWithLocales.__setLanguageAliases(aliases);
polyfill(RelativeTimeFormatWithLocales);
