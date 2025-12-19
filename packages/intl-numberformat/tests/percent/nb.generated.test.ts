import "@formatjs/intl-pluralrules/locale-data/nb.js"
import { test } from "./percentTest"
import * as localeData from "../locale-data/nb.json" with {type: 'json'}
test("nb", localeData);
