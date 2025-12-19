import "@formatjs/intl-pluralrules/locale-data/uk.js"
import { test } from "./percentTest"
import * as localeData from "../locale-data/uk.json" with {type: 'json'}
test("uk", localeData);
