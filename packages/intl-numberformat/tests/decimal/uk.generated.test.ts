import "@formatjs/intl-pluralrules/locale-data/uk.js"
import { test } from "./decimalTest"
import * as localeData from "../locale-data/uk.json" with {type: 'json'}
test("uk", localeData);
