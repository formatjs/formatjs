import com.ibm.icu.text.ListFormatter;
import com.ibm.icu.text.MeasureFormat;
import com.ibm.icu.text.RelativeDateTimeFormatter;
import com.ibm.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit;
import com.ibm.icu.text.SimpleDateFormat;
import com.ibm.icu.util.Measure;
import com.ibm.icu.util.MeasureUnit;
import com.ibm.icu.util.TimeZone;
import com.ibm.icu.util.ULocale;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

public class IntlLocaleFormattingConformanceTest {
    public static void main(String[] args) throws Exception {
        String path = System.getenv("LOCALE_FORMAT_FIXTURES");
        if (path == null || path.isEmpty()) {
            throw new IllegalStateException("LOCALE_FORMAT_FIXTURES is required");
        }
        List<String> rows = Files.readAllLines(Paths.get(path), StandardCharsets.UTF_8);
        int checks = 0;
        for (String row : rows.subList(1, rows.size())) {
            if (row.isEmpty()) continue;
            String[] expected = row.split("\t", -1);
            if (expected.length != 7) throw new IllegalArgumentException(row);
            ULocale locale = ULocale.forLanguageTag(expected[0]);
            RelativeDateTimeFormatter relative = RelativeDateTimeFormatter.getInstance(locale);
            SimpleDateFormat date = new SimpleDateFormat("EEE", locale);
            date.setTimeZone(TimeZone.getTimeZone("UTC"));
            String[] actual = {
                expected[0],
                ListFormatter.getInstance(locale).format("A", "B", "C"),
                relative.formatNumeric(-3, RelativeDateTimeUnit.WEEK),
                relative.formatNumeric(-3, RelativeDateTimeUnit.QUARTER),
                ULocale.forLanguageTag("und-US").getDisplayCountry(locale),
                date.format(new Date(0)),
                MeasureFormat.getInstance(locale, MeasureFormat.FormatWidth.WIDE)
                    .formatMeasures(new Measure(3, MeasureUnit.HOUR)),
            };
            if (!Arrays.equals(actual, expected)) {
                throw new AssertionError("ICU4J: " + Arrays.toString(actual)
                    + "; expected " + Arrays.toString(expected));
            }
            checks += 6;
        }
        if (checks == 0) throw new AssertionError("No locale fixtures");
        System.out.println(checks + " ICU4J locale formatting checks passed");
    }
}
