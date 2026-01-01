import '@formatjs/intl-pluralrules/locale-data/fr.js'
import {test} from './currencyTest'
import * as localeData from '../locale-data/fr.json' with {type: 'json'}
test('fr', localeData)
