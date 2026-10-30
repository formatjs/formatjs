import com.ibm.icu.util.ULocale;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

public class IntlCanonicalPrivateConformanceTest {
    public static void main(String[] args) throws Exception {
        var rows = Files.readAllLines(Paths.get(System.getenv("CANONICAL_PRIVATE_FIXTURES")), StandardCharsets.UTF_8);
        int checked = 0;
        for (String row : rows.subList(1, rows.size())) {
            String[] fields = row.split("\t", -1);
            if (fields.length != 2) throw new IllegalArgumentException(row);
            String actual = ULocale.createCanonical(ULocale.forLanguageTag(fields[0]).getName()).toLanguageTag();
            if (!actual.equals(fields[1])) throw new AssertionError(row + " actual=" + actual);
            checked++;
        }
        if (checked != 21) throw new AssertionError("Unexpected fixture count: " + checked);
        rows = Files.readAllLines(Paths.get(System.getenv("LOCALE_EXTENSION_OPTIONS_FIXTURES")), StandardCharsets.UTF_8);
        checked = 0;
        for (String row : rows.subList(1, rows.size())) {
            String[] fields = row.split("\t", -1);
            if (fields.length != 4) throw new IllegalArgumentException(row);
            ULocale locale = new ULocale.Builder().setLanguageTag(fields[0])
                .setUnicodeLocaleKeyword(fields[1], fields[2]).build();
            String actual = ULocale.createCanonical(locale.getName()).toLanguageTag();
            if (!actual.equals(fields[3])) throw new AssertionError(row + " actual=" + actual);
            checked++;
        }
        if (checked != 12) throw new AssertionError("Unexpected option fixture count: " + checked);
    }
}
