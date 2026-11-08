import com.ibm.icu.text.DisplayContext;
import com.ibm.icu.text.LocaleDisplayNames;
import com.ibm.icu.util.ULocale;
import com.ibm.icu.util.VersionInfo;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class DisplayNamesScriptOracle {
    public static void main(String[] args) throws Exception {
        if (VersionInfo.ICU_VERSION.getMajor() != 79 || VersionInfo.ICU_VERSION.getMinor() != 1)
            throw new AssertionError("ICU4J 79.1 required");
        List<String> rows = new ArrayList<>();
        Map<String, String[]> differences = new HashMap<>();
        List<String> differenceRows = Files.readAllLines(Path.of(args[1]), StandardCharsets.UTF_8);
        for (String row : differenceRows.subList(1, differenceRows.size())) {
            String[] fields = row.split("\t", -1);
            if (fields.length != 8) throw new AssertionError("Invalid ICU difference");
            String key = String.join("\t", java.util.Arrays.copyOf(fields, 5));
            if (differences.put(key, fields) != null) throw new AssertionError("Duplicate ICU difference");
        }
        Set<String> used = new HashSet<>();
        rows.add("locale\tstyle\tlanguageDisplay\tfallback\tcode\texpected\ticu4j\ticu4c");
        for (String locale : new String[] {"en", "nl", "ko", "ar", "zh"}) {
            for (String style : new String[] {"long", "short"}) {
                for (String display : new String[] {"dialect", "standard"}) {
                    for (String fallback : new String[] {"code", "none"}) {
                        LocaleDisplayNames names = LocaleDisplayNames.getInstance(
                            ULocale.forLanguageTag(locale),
                            display.equals("dialect") ? DisplayContext.DIALECT_NAMES : DisplayContext.STANDARD_NAMES,
                            style.equals("short") ? DisplayContext.LENGTH_SHORT : DisplayContext.LENGTH_FULL,
                            fallback.equals("none") ? DisplayContext.NO_SUBSTITUTE : DisplayContext.SUBSTITUTE
                        );
                        for (String code : new String[] {
                            "sr-Latn", "sr-Cyrl", "sr-Latn-RS", "uz-Latn", "az-Cyrl",
                            "pa-Arab", "bs-Latn", "zh-Hans", "zh-Hant", "zh-Hant-TW",
                            "en-Latn-US", "en-Cyrl-GB", "sr-Qaaa", "sr-Latn-XY"
                        }) {
                            String result = names.localeDisplayName(code.replace('-', '_'));
                            if (result == null) result = "!NONE";
                            String key = String.join("\t", locale, style, display, fallback, code);
                            String preferred = result;
                            String icu4c = result;
                            String[] difference = differences.get(key);
                            if (difference != null) {
                                if (!result.equals(difference[5])) throw new AssertionError("ICU4J difference changed: " + key);
                                icu4c = difference[6];
                                preferred = difference[7];
                                used.add(key);
                            }
                            rows.add(String.join("\t", key, preferred, result, icu4c));
                        }
                    }
                }
            }
        }
        if (used.size() != differences.size()) throw new AssertionError("Unused ICU differences");
        Files.write(Path.of(args[0]), rows, StandardCharsets.UTF_8);
        System.out.println((rows.size() - 1) + " ICU4J script display-name fixtures");
    }
}
