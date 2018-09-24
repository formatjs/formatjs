import { combineReducers } from 'redux';

import locales from './localesReducer';

const rootReducer = combineReducers({
  state: (state = {}) => state,
  locales
});

export default rootReducer;
