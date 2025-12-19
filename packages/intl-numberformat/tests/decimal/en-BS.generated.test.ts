import "@formatjs/intl-pluralrules/locale-data/en.js"
import { test } from "./decimalTest"
import * as localeData from "../locale-data/en-BS.json" with {type: 'json'}
test("en-BS", localeData);
