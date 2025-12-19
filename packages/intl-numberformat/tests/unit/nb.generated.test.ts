import "@formatjs/intl-pluralrules/locale-data/nb.js"
import { test } from "./unitTest"
import * as localeData from "../locale-data/nb.json" with {type: 'json'}
test("nb", localeData);
