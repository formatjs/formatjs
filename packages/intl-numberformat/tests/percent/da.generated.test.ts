import "@formatjs/intl-pluralrules/locale-data/da.js"
import { test } from "./percentTest"
import * as localeData from "../locale-data/da.json" with {type: 'json'}
test("da", localeData);
