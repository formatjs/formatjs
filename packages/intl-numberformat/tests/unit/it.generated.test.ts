import "@formatjs/intl-pluralrules/locale-data/it.js"
import { test } from "./unitTest"
import * as localeData from "../locale-data/it.json" with {type: 'json'}
test("it", localeData);
