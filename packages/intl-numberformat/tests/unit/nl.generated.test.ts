import "@formatjs/intl-pluralrules/locale-data/nl.js"
import { test } from "./unitTest"
import * as localeData from "../locale-data/nl.json" with {type: 'json'}
test("nl", localeData);
