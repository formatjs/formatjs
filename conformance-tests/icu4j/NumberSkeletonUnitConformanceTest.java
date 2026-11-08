import com.ibm.icu.number.NumberFormatter;
import com.ibm.icu.util.ULocale;
import com.ibm.icu.util.VersionInfo;

public class NumberSkeletonUnitConformanceTest {
    public static void main(String[] args) {
        if (VersionInfo.ICU_VERSION.getMajor() != 78 || VersionInfo.ICU_VERSION.getMinor() != 1)
            throw new AssertionError("ICU4J 78.1 required");
        String[][] cases = {
            {"unit/fluid-ounce", "5 fl oz"},
            {"unit/kilometer-per-hour", "5 km/h"},
            {"unit/meter-per-second", "5 m/s"},
            {"measure-unit/volume-fluid-ounce", "5 fl oz"},
            {"measure-unit/speed-kilometer-per-hour", "5 km/h"},
        };
        for (String[] test : cases) {
            String actual = NumberFormatter.forSkeleton(test[0]).locale(ULocale.ENGLISH).format(5).toString();
            if (!actual.equals(test[1]))
                throw new AssertionError(test[0] + ": expected " + test[1] + ", got " + actual);
        }
    }
}
