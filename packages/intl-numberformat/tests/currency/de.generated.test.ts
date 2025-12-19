import "@formatjs/intl-pluralrules/locale-data/de.js"
import { test } from "./currencyTest"
import * as localeData from "../locale-data/de.json" with {type: 'json'}
test("de", localeData);
