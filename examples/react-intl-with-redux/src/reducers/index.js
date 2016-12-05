import { combineReducers } from 'redux';
import { localeReducer } from './locale-reducer';

const rootReducer = combineReducers({
  locale: localeReducer
});

export default rootReducer;
