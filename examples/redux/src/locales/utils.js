export const DEFAULT_LOCALE = 'en';
export const LOCALES_LANGS = {
  'en': 'English',
  'fr': 'Français',
  'ar': 'العربية'
}

export const flattenMessages = (nestedMessages, prefix = '') => 
Object
  .keys(nestedMessages)
  .reduce((messages, key) => {
    const value = nestedMessages[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    const flatten = messages;

    if (typeof value === 'string') {
      flatten[prefixedKey] = value;
    } else {
      Object.assign(flatten, flattenMessages(value, prefixedKey));
    }

    return flatten;
  }, {});
