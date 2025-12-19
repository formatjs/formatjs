import "@formatjs/intl-pluralrules/locale-data/tr.js"
import { test } from "./currencyTest"
import * as localeData from "../locale-data/tr.json" with {type: 'json'}
test("tr", localeData);
