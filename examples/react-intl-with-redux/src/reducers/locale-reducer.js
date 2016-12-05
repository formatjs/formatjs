import { SPANISH_TRANSLATION } from './messages/es';
import { ENGLISH_TRANSLATION } from './messages/en';
import { FRENCH_TRANSLATION } from './messages/fr';

const initialState = {
  lang: SPANISH_TRANSLATION.lang,
  messages: SPANISH_TRANSLATION.messages
};
export const localeReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'LOCALE_SELECTED':
    switch (action.locale) {
      case 'en':
        return { ...initialState, lang: ENGLISH_TRANSLATION.lang, messages: ENGLISH_TRANSLATION.messages };
      case 'fr':
        return { ...initialState, lang: FRENCH_TRANSLATION.lang, messages: FRENCH_TRANSLATION.messages };
      default:
        return { ...initialState, lang: SPANISH_TRANSLATION.lang, messages: SPANISH_TRANSLATION.messages };
    }
    default:
      return state;
  }
};
