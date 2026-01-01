import '@formatjs/intl-pluralrules/locale-data/ko.js'
import {test} from './currencyTest'
import * as localeData from '../locale-data/ko.json' with {type: 'json'}
test('ko', localeData)
