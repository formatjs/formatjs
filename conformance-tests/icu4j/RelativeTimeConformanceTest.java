import com.ibm.icu.text.DisplayContext;
import com.ibm.icu.text.DecimalFormat;
import com.ibm.icu.text.NumberFormat;
import com.ibm.icu.text.RelativeDateTimeFormatter;
import com.ibm.icu.text.RelativeDateTimeFormatter.RelativeDateTimeUnit;
import com.ibm.icu.util.ULocale;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Locale;

public class RelativeTimeConformanceTest {
    public static void main(String[] args) throws Exception {
        String path = System.getenv("RELATIVE_TIME_DIFFERENCES");
        if (path == null) throw new IllegalStateException("RELATIVE_TIME_DIFFERENCES is required");
        int checked = 0;
        var rows = Files.readAllLines(Paths.get(path), StandardCharsets.UTF_8);
        for (String row : rows.subList(1, rows.size())) {
            String[] f = row.split("\t", -1);
            if (f.length != 8 || f[6].equals(f[7])) throw new IllegalArgumentException(row);
            String tag = f[0] + (f[1].equals("_") ? "" : "-u-nu-" + f[1]);
            ULocale locale = ULocale.forLanguageTag(tag);
            DecimalFormat number = (DecimalFormat) NumberFormat.getInstance(locale);
            // ECMA-402 creates an internal NumberFormat with grouping "auto".
            number.setMinimumGroupingDigits(DecimalFormat.MINIMUM_GROUPING_DIGITS_AUTO);
            number.setMinimumFractionDigits(0);
            number.setMaximumFractionDigits(3);
            RelativeDateTimeFormatter formatter = RelativeDateTimeFormatter.getInstance(
                locale, number,
                RelativeDateTimeFormatter.Style.valueOf(f[2].toUpperCase(Locale.ROOT)),
                DisplayContext.CAPITALIZATION_NONE);
            RelativeDateTimeUnit unit = RelativeDateTimeUnit.valueOf(f[4].toUpperCase(Locale.ROOT));
            double value = Double.parseDouble(f[5]);
            String actual = f[3].equals("always") ? formatter.formatNumeric(value, unit) : formatter.format(value, unit);
            if (!actual.equals(f[6])) throw new AssertionError("ICU4J: " + row + "; actual: " + actual);
            checked++;
        }
        if (checked != 1440) throw new AssertionError("Unexpected fixture count: " + checked);
        System.out.println(checked + " ICU4J relative-time differences verified");
    }
}
