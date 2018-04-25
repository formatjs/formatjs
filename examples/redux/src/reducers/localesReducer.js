import { UPDATE_LOCALE } from '../actions/localesActions';
import translation from '../locales/messages';
import { DEFAULT_LOCALE } from '../locales/utils';

const defaultState = {
  locale: DEFAULT_LOCALE,
  messages: translation[DEFAULT_LOCALE]
};

const localesReducer = (state = defaultState, action) => {
  switch (action.type) {
    case UPDATE_LOCALE:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}

export default localesReducer;
