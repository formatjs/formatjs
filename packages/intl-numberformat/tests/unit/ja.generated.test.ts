import "@formatjs/intl-pluralrules/locale-data/ja.js"
import { test } from "./unitTest"
import * as localeData from "../locale-data/ja.json" with {type: 'json'}
test("ja", localeData);
