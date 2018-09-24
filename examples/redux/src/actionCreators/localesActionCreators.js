import { UPDATE_LOCALE } from '../actions/localesActions';
import messages from '../locales/messages';
import { flattenMessages } from '../locales/utils';

export const updateLocales = (locale) => ({
  type: UPDATE_LOCALE,
  payload: {
    locale,
    messages: flattenMessages(messages[locale])
  }
})
