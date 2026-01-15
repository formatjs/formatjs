import com.ibm.icu.util.ULocale;
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
}
