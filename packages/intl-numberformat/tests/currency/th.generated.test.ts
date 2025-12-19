import "@formatjs/intl-pluralrules/locale-data/th.js"
import { test } from "./currencyTest"
import * as localeData from "../locale-data/th.json" with {type: 'json'}
test("th", localeData);
