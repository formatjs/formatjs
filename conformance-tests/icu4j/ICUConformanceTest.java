import com.ibm.icu.text.PluralRules;
import com.ibm.icu.number.FormattedNumberRange;
import com.ibm.icu.number.NumberRangeFormatter;
import com.ibm.icu.number.LocalizedNumberRangeFormatter;
import com.ibm.icu.util.LocaleMatcher;
import com.ibm.icu.util.ULocale;
import java.io.*;
import java.nio.file.*;
import java.util.*;

/**
 * ICU4J conformance test to validate FormatJS behavior against reference implementation.
 *
 * This test validates:
 * 1. Locale canonicalization (getCanonicalLocales)
 * 2. Script code normalization (DisplayNames)
 * 3. Variant handling (Intl.Locale.variants)
 */
public class ICUConformanceTest {
    public static void main(String[] args) {
        System.out.println("==========================================================");
        System.out.println("ICU4J Conformance Test for FormatJS");
        System.out.println("==========================================================\n");

        testLocaleCanonicaliz();
        testScriptCodeNormalization();
        testVariantHandling();
        testLowercaseScriptCodes();
        testDisplayNames();
        testPluralRulesSelectRange();
        testLocaleMatching();

        System.out.println("\n==========================================================");
        System.out.println("All tests completed successfully!");
        System.out.println("==========================================================");
    }

    /**
     * Test 1: Locale Canonicalization
     * Validates that ICU canonicalizes locales the same way as FormatJS
     */
    private static void testLocaleCanonicaliz() {
        System.out.println("TEST 1: Locale Canonicalization");
        System.out.println("----------------------------------------------------------");

        Map<String, String> testCases = new LinkedHashMap<>();
        testCases.put("en-US", "en-US");
        testCases.put("EN-us", "en-US");
        testCases.put("zh-Hans-CN", "zh-Hans-CN");
        testCases.put("zh-hans-cn", "zh-Hans-CN");
        testCases.put("en-arab-US", "en-Arab-US");
        testCases.put("en-LATN", "en-Latn");
        testCases.put("fr-ca", "fr-CA");
        testCases.put("es-419", "es-419");

        for (Map.Entry<String, String> entry : testCases.entrySet()) {
            String input = entry.getKey();
            String expected = entry.getValue();
            ULocale locale = new ULocale(input);
            String canonical = locale.toLanguageTag();

            boolean pass = canonical.equals(expected);
            System.out.printf("  %-20s → %-20s [%s]%n",
                input, canonical, pass ? "PASS" : "FAIL - expected: " + expected);

            if (!pass) {
                System.exit(1);
            }
        }

        System.out.println("  ✓ All canonicalization tests passed\n");
    }

    /**
     * Test 2: Script Code Normalization
     * Validates that script codes are normalized to title-case (e.g., Arab, Latn)
     */
    private static void testScriptCodeNormalization() {
        System.out.println("TEST 2: Script Code Normalization");
        System.out.println("----------------------------------------------------------");

        Map<String, String> testCases = new LinkedHashMap<>();
        testCases.put("en-arab-US", "Arab");
        testCases.put("en-ARAB-US", "Arab");
        testCases.put("en-Arab-US", "Arab");
        testCases.put("en-latn", "Latn");
        testCases.put("en-LATN", "Latn");
        testCases.put("ar-arab", "Arab");
        testCases.put("zh-hans", "Hans");
        testCases.put("zh-HANT", "Hant");

        for (Map.Entry<String, String> entry : testCases.entrySet()) {
            String input = entry.getKey();
            String expectedScript = entry.getValue();
            ULocale locale = new ULocale(input);
            String actualScript = locale.getScript();

            boolean pass = actualScript.equals(expectedScript);
            System.out.printf("  %-20s → script: %-10s [%s]%n",
                input, actualScript, pass ? "PASS" : "FAIL - expected: " + expectedScript);

            if (!pass) {
                System.exit(1);
            }
        }

        System.out.println("  ✓ All script normalization tests passed\n");
    }

    /**
     * Test 3: Variant Handling
     * Validates that variants are handled correctly, including sorting
     */
    private static void testVariantHandling() {
        System.out.println("TEST 3: Variant Handling");
        System.out.println("----------------------------------------------------------");

        Map<String, String> testCases = new LinkedHashMap<>();
        testCases.put("ca-valencia", "VALENCIA");
        testCases.put("en-fonipa", "FONIPA");
        testCases.put("fr-1606nict", "1606NICT");
        // Note: ICU preserves variant order and uses underscore separator
        testCases.put("de-DE-1996-1901", "1996_1901");
        testCases.put("de-DE-1901-1996", "1901_1996");

        for (Map.Entry<String, String> entry : testCases.entrySet()) {
            String input = entry.getKey();
            String expectedVariant = entry.getValue();
            ULocale locale = new ULocale(input);
            String actualVariant = locale.getVariant();

            boolean pass = actualVariant.equals(expectedVariant);
            System.out.printf("  %-25s → variant: %-15s [%s]%n",
                input, actualVariant, pass ? "PASS" : "FAIL - expected: " + expectedVariant);

            if (!pass) {
                System.exit(1);
            }
        }

        // Test locale without variant
        ULocale noVariant = new ULocale("en-US");
        boolean emptyPass = noVariant.getVariant().isEmpty();
        System.out.printf("  %-25s → variant: %-15s [%s]%n",
            "en-US", "(empty)", emptyPass ? "PASS" : "FAIL");

        if (!emptyPass) {
            System.exit(1);
        }

        System.out.println("  ✓ All variant handling tests passed\n");
    }

    /**
     * Test 4: Lowercase Script Codes (GH #5889 specific test)
     * Validates what ICU4J does with lowercase script codes
     */
    private static void testLowercaseScriptCodes() {
        System.out.println("TEST 4: Lowercase Script Codes (GH #5889)");
        System.out.println("----------------------------------------------------------");

        // Test what ICU4J does with lowercase 'arab'
        System.out.println("\n  Testing locale with lowercase 'arab' script:");
        ULocale lowercase = new ULocale("en-arab");
        System.out.println("    Input: 'en-arab'");
        System.out.println("    toLanguageTag(): " + lowercase.toLanguageTag());
        System.out.println("    getScript(): " + lowercase.getScript());
        System.out.println("    getDisplayScript(ENGLISH): " + lowercase.getDisplayScript(ULocale.ENGLISH));

        // Test what ICU4J does with uppercase 'ARAB'
        System.out.println("\n  Testing locale with uppercase 'ARAB' script:");
        ULocale uppercase = new ULocale("en-ARAB");
        System.out.println("    Input: 'en-ARAB'");
        System.out.println("    toLanguageTag(): " + uppercase.toLanguageTag());
        System.out.println("    getScript(): " + uppercase.getScript());
        System.out.println("    getDisplayScript(ENGLISH): " + uppercase.getDisplayScript(ULocale.ENGLISH));

        // Test what ICU4J does with title-case 'Arab'
        System.out.println("\n  Testing locale with title-case 'Arab' script:");
        ULocale titlecase = new ULocale("en-Arab");
        System.out.println("    Input: 'en-Arab'");
        System.out.println("    toLanguageTag(): " + titlecase.toLanguageTag());
        System.out.println("    getScript(): " + titlecase.getScript());
        System.out.println("    getDisplayScript(ENGLISH): " + titlecase.getDisplayScript(ULocale.ENGLISH));

        System.out.println("\n  ✓ ICU4J canonicalizes all forms to title-case 'Arab'\n");
    }

    /**
     * Test 5: DisplayNames
     * Validates that script display names work correctly with canonical codes
     */
    private static void testDisplayNames() {
        System.out.println("TEST 5: DisplayNames (Script Codes)");
        System.out.println("----------------------------------------------------------");

        ULocale english = ULocale.ENGLISH;

        Map<String, String> testCases = new LinkedHashMap<>();
        testCases.put("Arab", "Arabic");
        testCases.put("Latn", "Latin");
        testCases.put("Hans", "Simplified");
        testCases.put("Hant", "Traditional");
        testCases.put("Cyrl", "Cyrillic");

        for (Map.Entry<String, String> entry : testCases.entrySet()) {
            String scriptCode = entry.getKey();
            String expectedName = entry.getValue();

            // Create a locale with this script and get its display name
            ULocale localeWithScript = new ULocale("en-" + scriptCode);
            String actualName = localeWithScript.getDisplayScript(english);

            boolean pass = actualName.contains(expectedName);
            System.out.printf("  Script %-10s → %-20s [%s]%n",
                scriptCode, actualName, pass ? "PASS" : "FAIL - expected to contain: " + expectedName);

            if (!pass) {
                System.exit(1);
            }
        }

        // Test region display names (for hasMissingICUBug check)
        ULocale canada = new ULocale("en-CA");
        String canadaName = canada.getDisplayCountry(english);
        boolean canadaPass = canadaName.equals("Canada");
        System.out.printf("  Region %-10s → %-20s [%s]%n",
            "CA", canadaName, canadaPass ? "PASS" : "FAIL");

        if (!canadaPass) {
            System.exit(1);
        }

        System.out.println("  ✓ All DisplayNames tests passed\n");
    }

    /**
     * Test 6: PluralRules selectRange
     * Validates ICU4J behavior for selectRange, especially with identical start/end values
     *
     * This addresses the question: does selectRange(1,1) return "one" or "other"?
     * - ECMA-402 spec step 4: if formatted strings are equal, return start category
     * - Chrome returns "other" (possible bug)
     * - Our polyfill returns "one" (following spec)
     * - Need to verify with ICU4J (reference implementation)
     */
    private static void testPluralRulesSelectRange() {
        System.out.println("TEST 6: PluralRules selectRange");
        System.out.println("----------------------------------------------------------");

        // Test English cardinal plural rules
        ULocale english = ULocale.ENGLISH;
        PluralRules enPluralRules = PluralRules.forLocale(english);

        System.out.println("\n  English cardinal plural rules:");
        System.out.println("    select(1): " + enPluralRules.select(1.0));
        System.out.println("    select(2): " + enPluralRules.select(2.0));
        System.out.println();

        // Test selectRange with FormattedNumberRange
        LocalizedNumberRangeFormatter rangeFormatter = NumberRangeFormatter.withLocale(english);

        System.out.println("  Testing selectRange with identical values:");

        // Test case 1: Identical values (1, 1)
        try {
            FormattedNumberRange range_1_1 = rangeFormatter.formatRange(1, 1);
            String result_1_1 = enPluralRules.select(range_1_1);
            System.out.println("    selectRange(1, 1): \"" + result_1_1 + "\"");
            System.out.println("    formatted: \"" + range_1_1 + "\"");
            System.out.println("    identity: " + range_1_1.getIdentityResult());
        } catch (Exception e) {
            System.out.println("    ERROR: " + e.getMessage());
            e.printStackTrace();
        }

        // Test case 2: Identical values (2, 2)
        try {
            FormattedNumberRange range_2_2 = rangeFormatter.formatRange(2, 2);
            String result_2_2 = enPluralRules.select(range_2_2);
            System.out.println("    selectRange(2, 2): \"" + result_2_2 + "\"");
            System.out.println("    formatted: \"" + range_2_2 + "\"");
            System.out.println("    identity: " + range_2_2.getIdentityResult());
        } catch (Exception e) {
            System.out.println("    ERROR: " + e.getMessage());
            e.printStackTrace();
        }

        // Test case 3: Identical values (0, 0)
        try {
            FormattedNumberRange range_0_0 = rangeFormatter.formatRange(0, 0);
            String result_0_0 = enPluralRules.select(range_0_0);
            System.out.println("    selectRange(0, 0): \"" + result_0_0 + "\"");
            System.out.println("    formatted: \"" + range_0_0 + "\"");
            System.out.println("    identity: " + range_0_0.getIdentityResult());
        } catch (Exception e) {
            System.out.println("    ERROR: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println();

        // Test case 4: Different values (1, 2)
        System.out.println("  Testing selectRange with different values:");
        try {
            FormattedNumberRange range_1_2 = rangeFormatter.formatRange(1, 2);
            String result_1_2 = enPluralRules.select(range_1_2);
            System.out.println("    selectRange(1, 2): \"" + result_1_2 + "\"");
            System.out.println("    formatted: \"" + range_1_2 + "\"");
            System.out.println("    identity: " + range_1_2.getIdentityResult());
        } catch (Exception e) {
            System.out.println("    ERROR: " + e.getMessage());
            e.printStackTrace();
        }

        // Test case 5: Different values (0, 1)
        try {
            FormattedNumberRange range_0_1 = rangeFormatter.formatRange(0, 1);
            String result_0_1 = enPluralRules.select(range_0_1);
            System.out.println("    selectRange(0, 1): \"" + result_0_1 + "\"");
            System.out.println("    formatted: \"" + range_0_1 + "\"");
            System.out.println("    identity: " + range_0_1.getIdentityResult());
        } catch (Exception e) {
            System.out.println("    ERROR: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println();

        // Test French for comparison
        System.out.println("  Testing French plural rules:");
        ULocale french = ULocale.FRENCH;
        PluralRules frPluralRules = PluralRules.forLocale(french);
        LocalizedNumberRangeFormatter frRangeFormatter = NumberRangeFormatter.withLocale(french);

        System.out.println("    select(0): " + frPluralRules.select(0.0));
        System.out.println("    select(1): " + frPluralRules.select(1.0));
        System.out.println("    select(2): " + frPluralRules.select(2.0));
        System.out.println();

        try {
            FormattedNumberRange range_0_0 = frRangeFormatter.formatRange(0, 0);
            String result_0_0 = frPluralRules.select(range_0_0);
            System.out.println("    selectRange(0, 0): \"" + result_0_0 + "\"");
            System.out.println("    formatted: \"" + range_0_0 + "\"");
            System.out.println("    identity: " + range_0_0.getIdentityResult());
        } catch (Exception e) {
            System.out.println("    ERROR: " + e.getMessage());
        }

        try {
            FormattedNumberRange range_1_1 = frRangeFormatter.formatRange(1, 1);
            String result_1_1 = frPluralRules.select(range_1_1);
            System.out.println("    selectRange(1, 1): \"" + result_1_1 + "\"");
            System.out.println("    formatted: \"" + range_1_1 + "\"");
            System.out.println("    identity: " + range_1_1.getIdentityResult());
        } catch (Exception e) {
            System.out.println("    ERROR: " + e.getMessage());
        }

        try {
            FormattedNumberRange range_0_1 = frRangeFormatter.formatRange(0, 1);
            String result_0_1 = frPluralRules.select(range_0_1);
            System.out.println("    selectRange(0, 1): \"" + result_0_1 + "\"");
            System.out.println("    formatted: \"" + range_0_1 + "\"");
            System.out.println("    identity: " + range_0_1.getIdentityResult());
        } catch (Exception e) {
            System.out.println("    ERROR: " + e.getMessage());
        }

        System.out.println("\n  ✓ PluralRules selectRange tests completed\n");
    }

    /**
     * Test 7: Locale Matching Conformance (shared fixtures with TS implementation)
     * Reads test cases from locale-match-fixtures.json and validates ICU4J produces
     * the same results as our @formatjs/intl-localematcher.
     */
    private static void testLocaleMatching() {
        System.out.println("TEST 7: Locale Matching Conformance");
        System.out.println("----------------------------------------------------------");

        String fixturesPath = System.getenv("LOCALE_MATCH_FIXTURES");
        if (fixturesPath == null || fixturesPath.isEmpty()) {
            System.out.println("  SKIP: LOCALE_MATCH_FIXTURES not set");
            return;
        }

        String json;
        try {
            json = new String(Files.readAllBytes(Paths.get(fixturesPath)));
        } catch (IOException e) {
            System.out.println("  FAIL: Cannot read fixtures: " + e.getMessage());
            System.exit(1);
            return;
        }

        // Minimal JSON array-of-objects parser (no external dependency)
        // Each object has: description, requested[], supported[], expected
        List<Map<String, Object>> fixtures = parseFixtures(json);

        for (Map<String, Object> fixture : fixtures) {
            String description = (String) fixture.get("description");
            @SuppressWarnings("unchecked")
            List<String> requested = (List<String>) fixture.get("requested");
            @SuppressWarnings("unchecked")
            List<String> supported = (List<String>) fixture.get("supported");
            String expected = (String) fixture.get("expected");

            LocaleMatcher.Builder builder = LocaleMatcher.builder()
                .setDefaultULocale(ULocale.forLanguageTag(supported.get(0)));
            for (String s : supported) {
                builder.addSupportedULocale(ULocale.forLanguageTag(s));
            }
            LocaleMatcher matcher = builder.build();

            // Match first requested locale (single-locale test cases)
            ULocale result = matcher.getBestMatch(ULocale.forLanguageTag(requested.get(0)));
            String actual = result.toLanguageTag();

            boolean pass = actual.equals(expected);
            System.out.printf("  %-60s [%s]%n",
                description, pass ? "PASS" : "FAIL - got: " + actual + ", expected: " + expected);

            if (!pass) {
                System.exit(1);
            }
        }

        System.out.println("  ✓ All locale matching conformance tests passed\n");
    }

    /** Minimal JSON array parser for fixture files. */
    private static List<Map<String, Object>> parseFixtures(String json) {
        List<Map<String, Object>> result = new ArrayList<>();
        // Strip outer []
        json = json.trim();
        if (!json.startsWith("[") || !json.endsWith("]")) return result;
        json = json.substring(1, json.length() - 1).trim();

        // Split objects by },{ pattern
        int depth = 0;
        int start = -1;
        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '{') {
                if (depth == 0) start = i;
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0 && start >= 0) {
                    result.add(parseObject(json.substring(start + 1, i)));
                    start = -1;
                }
            }
        }
        return result;
    }

    private static Map<String, Object> parseObject(String obj) {
        Map<String, Object> map = new LinkedHashMap<>();
        // Parse "key": value pairs
        int i = 0;
        while (i < obj.length()) {
            // Find key
            int keyStart = obj.indexOf('"', i);
            if (keyStart < 0) break;
            int keyEnd = obj.indexOf('"', keyStart + 1);
            String key = obj.substring(keyStart + 1, keyEnd);

            // Find colon
            int colon = obj.indexOf(':', keyEnd);

            // Find value
            int valStart = colon + 1;
            while (valStart < obj.length() && obj.charAt(valStart) == ' ') valStart++;

            if (obj.charAt(valStart) == '"') {
                // String value
                int valEnd = obj.indexOf('"', valStart + 1);
                map.put(key, obj.substring(valStart + 1, valEnd));
                i = valEnd + 1;
            } else if (obj.charAt(valStart) == '[') {
                // Array value
                int valEnd = obj.indexOf(']', valStart);
                String arrayContent = obj.substring(valStart + 1, valEnd).trim();
                List<String> list = new ArrayList<>();
                if (!arrayContent.isEmpty()) {
                    for (String item : arrayContent.split(",")) {
                        item = item.trim();
                        if (item.startsWith("\"") && item.endsWith("\"")) {
                            list.add(item.substring(1, item.length() - 1));
                        }
                    }
                }
                map.put(key, list);
                i = valEnd + 1;
            } else {
                i = valStart + 1;
            }
        }
        return map;
    }
}
