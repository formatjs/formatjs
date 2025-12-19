import "@formatjs/intl-pluralrules/locale-data/sv.js"
import { test } from "./unitTest"
import * as localeData from "../locale-data/sv.json" with {type: 'json'}
test("sv", localeData);
