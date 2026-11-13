import com.ibm.icu.number.NumberFormatter;
import com.ibm.icu.util.ULocale;
import com.ibm.icu.util.VersionInfo;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;

public final class PrecisionOracle {
    public static void main(String[] args) throws Exception {
        if (VersionInfo.ICU_VERSION.getMajor() != 79) throw new AssertionError("ICU 79 required");
        var rows = Files.readAllLines(Path.of(System.getenv("PRECISION_FIXTURES")));
        int checked = 0;
        for (String row : rows.subList(1, rows.size())) {
            String[] fields = row.split("\t", -1);
            String actual = NumberFormatter.forSkeleton(fields[4]).locale(ULocale.ENGLISH)
                .format(new BigDecimal(fields[0])).toString();
            if (!actual.equals(fields[5])) throw new AssertionError(row + "; actual=" + actual);
            checked++;
        }
        if (checked != 27) throw new AssertionError("Incomplete precision matrix: " + checked);
        System.out.println(checked + " ICU4J 79 precision cases");
    }
}
