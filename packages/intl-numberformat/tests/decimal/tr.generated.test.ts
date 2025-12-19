import "@formatjs/intl-pluralrules/locale-data/tr.js"
import { test } from "./decimalTest"
import * as localeData from "../locale-data/tr.json" with {type: 'json'}
test("tr", localeData);
