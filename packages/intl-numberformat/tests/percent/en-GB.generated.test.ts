import "@formatjs/intl-pluralrules/locale-data/en.js"
import { test } from "./percentTest"
import * as localeData from "../locale-data/en-GB.json" with {type: 'json'}
test("en-GB", localeData);
