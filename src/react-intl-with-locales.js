import allLocales from './locale-data/index';
import {addLocaleData} from './react-intl';

export * from './react-intl';

addLocaleData(allLocales);
