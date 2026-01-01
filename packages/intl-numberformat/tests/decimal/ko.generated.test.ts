import '@formatjs/intl-pluralrules/locale-data/ko.js'
import {test} from './decimalTest'
import * as localeData from '../locale-data/ko.json' with {type: 'json'}
test('ko', localeData)
