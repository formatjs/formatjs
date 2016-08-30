import frLocaleData from '../../../locale-data/fr';
import { defineMessages, addLocaleData } from 'react-intl';

addLocaleData(frLocaleData);

/**
 * Défini tous les messages de l'application pour la traduction multi-langue avec React-intl
 */
const messages = defineMessages({
  home: {
    id: 'home',
    description: 'Home',
    defaultMessage: 'Home',
  },
  inbox: {
    id: 'inbox',
    description: 'Inbox',
    defaultMessage: 'Inbox',
  },
  otherLanguage: {
    id: 'otherLanguage',
    description: 'FR',
    defaultMessage: 'FR',
  },
  todayIs: {
    id: 'todayIs',
    description: 'Today is',
    defaultMessage: 'Today is',
  },
  youHave: {
    id: 'youHave',
    description: 'You have',
    defaultMessage: 'You have',
  },
});

export default messages;
