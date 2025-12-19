import "@formatjs/intl-pluralrules/locale-data/de.js"
import { test } from "./percentTest"
import * as localeData from "../locale-data/de.json" with {type: 'json'}
test("de", localeData);
