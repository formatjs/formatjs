import "@formatjs/intl-pluralrules/locale-data/ru.js"
import { test } from "./unitTest"
import * as localeData from "../locale-data/ru.json" with {type: 'json'}
test("ru", localeData);
