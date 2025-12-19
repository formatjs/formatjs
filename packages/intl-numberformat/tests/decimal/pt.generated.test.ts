import "@formatjs/intl-pluralrules/locale-data/pt.js"
import { test } from "./decimalTest"
import * as localeData from "../locale-data/pt.json" with {type: 'json'}
test("pt", localeData);
