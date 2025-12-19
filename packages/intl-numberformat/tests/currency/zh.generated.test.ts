import "@formatjs/intl-pluralrules/locale-data/zh.js"
import { test } from "./currencyTest"
import * as localeData from "../locale-data/zh.json" with {type: 'json'}
test("zh", localeData);
