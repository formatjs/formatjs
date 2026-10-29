import com.ibm.icu.util.LocaleMatcher;
import com.ibm.icu.util.ULocale;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class LocaleMatcherConformanceTest {
    public static void main(String[] args) throws Exception {
        if (args.length == 2 && args[0].equals("--grid")) {
            grid(args[1]);
            return;
        }
        run(args.length > 0 && args[0].equals("--print"));
    }

    @SuppressWarnings("unchecked")
    static void run(boolean print) throws Exception {
        String path = System.getenv("LOCALE_MATCH_FIXTURES");
        if (path == null)
            throw new IllegalStateException("LOCALE_MATCH_FIXTURES is required");
        List<Map<String, Object>> cases =
            ICUConformanceTest.parseFixtures(Files.readString(Paths.get(path)));
        if (cases.isEmpty())
            throw new IllegalStateException("No locale fixtures");
        int failures = 0;
        for (int i = 0; i < cases.size(); i++) {
            Map<String, Object> test = cases.get(i);
            List<String> supported = (List<String>) test.get("supported");
            List<String> requested = (List<String>) test.get("requested");
            String fallback = (String) test.getOrDefault(
                "defaultLocale", supported.isEmpty() ? "en" : supported.get(0));
            LocaleMatcher.Builder builder =
                LocaleMatcher.builder().setDefaultULocale(canonical(fallback));
            for (String tag : supported) builder.addSupportedULocale(canonical(tag));
            List<ULocale> desired = new ArrayList<>();
            for (String tag : requested) desired.add(canonical(tag));
            LocaleMatcher.Result result = builder.build().getBestMatchResult(desired);
            int index = result.getSupportedIndex();
            String actual = index < 0 ? fallback : supported.get(index);
            if (print) {
                System.out.printf(
                    "CASE\t%d\t%d\t%d\t%s%n", i, index, result.getDesiredIndex(), actual);
            } else if (!actual.equals(test.get("expected"))
                || (test.containsKey("desiredIndex")
                    && result.getDesiredIndex()
                        != Integer.parseInt((String) test.get("desiredIndex")))) {
                System.err.printf("%s: got %s (desired %d), expected %s (desired %s)%n",
                    test.get("description"), actual, result.getDesiredIndex(), test.get("expected"),
                    test.get("desiredIndex"));
                failures++;
            }
        }
        if (failures > 0)
            throw new AssertionError(failures + " ICU4J locale matching failures");
        if (!print)
            System.out.println(cases.size() + " ICU4J locale matching checks passed");
    }

    private static ULocale canonical(String tag) {
        return ULocale.createCanonical(ULocale.forLanguageTag(tag));
    }

    private static void grid(String path) throws Exception {
        String[] tags = {"en", "en-US", "en-Latn", "en-Latn-US", "en-AU", "en-IN", "en-001",
            "en-019", "en-XX", "en-ZZ", "en-Zzzz", "es", "es-MX", "es-CO", "es-419", "es-001",
            "pt-MZ", "ar-MA", "fr-BE", "fr-Latn", "zh", "zh-TW", "zh-Hant", "zh-Hant-TW", "zh-HK",
            "sr-Latn", "sr-Cyrl", "sr-Latn-BA", "sh", "bs", "br", "gsw", "da", "no", "nb", "nn",
            "cs", "sk", "ja", "ja-Latn", "am", "bn", "qaa", "qaa-Arab", "qaa-Latn", "qaa-Arab-EG",
            "und", "und-TW", "und-Latn", "und-001", "und-419", "qaa-419", "und-Latn-419",
            "und-Zzzz", "und-ZZ", "und-1901", "und-x-custom", "und-x-other", "de-1901",
            "de-x-psaccent", "en-XA", "en-XB", "en-XC", "en-psaccent", "en-psbidi", "en-pscrack"};
        String[][] sets = {{"en", "en-GB", "fr", "es", "es-419", "pt-BR", "pt-PT", "zh", "zh-Hant",
                               "sr", "sr-Latn"},
            {"en-US", "en", "en-Latn", "en-Latn-US"}, {"en-IN", "en-AU", "en-GB"},
            {"es-AR", "es-MX", "es-419", "es"}, {"fr-CH", "fr-FR", "fr-CA"},
            {"zh-Hant-TW", "zh-Hant", "zh-TW", "zh-MO"}, {"bs", "sh", "sr-Cyrl"},
            {"br", "gsw", "de", "fr"}, {"sv", "nb", "nn", "no", "da"}, {"cs", "sk", "ja", "en"},
            {"und", "und-x-custom", "qaa", "en"}, {"en-XA", "en-psaccent", "en-XB", "en-XC", "en"},
            {"es-001", "es-419", "en-001", "en-019", "en-GB"}, {"de-1901", "de", "de-DE"},
            {"ar-EG", "ar-DZ", "ar"}, {"en-Zzzz", "en-ZZ", "en", "en-US"},
            {"qaa", "qaa-Arab", "qaa-Latn", "qaa-Arab-EG"},
            {"und-Zzzz", "und-ZZ", "und-1901", "und", "und-x-custom"}, {"und-419", "es-419", "es"},
            {"qaa-419", "qaa", "qaa-Latn-419"}};
        List<String> lines = new ArrayList<>();
        for (String[] supported : sets) {
            for (String fallback : new String[] {"en", supported[0]}) {
                LocaleMatcher.Builder builder =
                    LocaleMatcher.builder().setDefaultULocale(canonical(fallback));
                for (String tag : supported) builder.addSupportedULocale(canonical(tag));
                LocaleMatcher matcher = builder.build();
                for (String tag : tags) {
                    for (String[] requested : new String[][] {{tag}, {tag, "fr", "en"}}) {
                        List<ULocale> desired = new ArrayList<>();
                        for (String item : requested) desired.add(canonical(item));
                        LocaleMatcher.Result result = matcher.getBestMatchResult(desired);
                        int index = result.getSupportedIndex();
                        lines.add(String.join(",", requested) + "\t" + String.join(",", supported)
                            + "\t" + fallback + "\t" + (index < 0 ? fallback : supported[index])
                            + "\t" + result.getDesiredIndex());
                    }
                }
            }
        }
        Files.write(Paths.get(path), lines);
    }
}
