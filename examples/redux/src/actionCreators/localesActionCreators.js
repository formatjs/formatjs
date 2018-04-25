import { UPDATE_LOCALE } from '../actions/localesActions';
import messages from '../locales/messages';

export const updateLocales = (locale) => ({
  type: UPDATE_LOCALE,
  payload: {
    locale,
    messages: messages[locale]
  }
})
