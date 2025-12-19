import "@formatjs/intl-pluralrules/locale-data/sv.js"
import { test } from "./decimalTest"
import * as localeData from "../locale-data/sv.json" with {type: 'json'}
test("sv", localeData);
