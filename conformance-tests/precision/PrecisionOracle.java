import com.ibm.icu.number.NumberFormatter;
import com.ibm.icu.text.PluralRules;
import com.ibm.icu.util.ULocale;
import com.ibm.icu.util.VersionInfo;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;

public final class PrecisionOracle {
    public static void main(String[] args) throws Exception {
        if (VersionInfo.ICU_VERSION.getMajor() != 79) throw new AssertionError("ICU 79 required");
        int checked = 0;
        for (String key : new String[]{"PRECISION_FIXTURES", "PUBLIC_PRECISION_FIXTURES"}) {
            var rows = Files.readAllLines(Path.of(System.getenv(key)));
            for (String row : rows.subList(1, rows.size())) {
                String[] fields = row.split("\t", -1);
                var decimal = new BigDecimal(fields[0]);
                Number input = decimal;
                if (decimal.signum() == 0 && fields[0].startsWith("-")) input = -0.0;
                var formatted = NumberFormatter.forSkeleton(fields[4]).locale(ULocale.ENGLISH)
                    .format(input);
                String actual = formatted.toString();
                if (!actual.equals(fields[5])) throw new AssertionError(row + "; actual=" + actual);
                if (!fields[6].equals("-") && !PluralRules.forLocale(ULocale.ENGLISH).select(formatted).equals(fields[6]))
                    throw new AssertionError("Plural operands: " + row);
                checked++;
            }
        }
        if (checked != 44) throw new AssertionError("Incomplete precision matrix: " + checked);
        System.out.println(checked + " ICU4J 79 precision cases");
    }
}
