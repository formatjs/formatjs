import "@formatjs/intl-pluralrules/locale-data/en.js"
import { test } from "./currencyTest"
import * as localeData from "../locale-data/en.json" with {type: 'json'}
test("en", localeData);
