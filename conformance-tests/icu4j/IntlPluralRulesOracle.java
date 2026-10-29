import com.ibm.icu.text.PluralRules;
import com.ibm.icu.number.NumberFormatter;
import com.ibm.icu.number.LocalizedNumberFormatter;
import com.ibm.icu.number.Precision;
import java.math.RoundingMode;
import com.ibm.icu.util.ULocale;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class IntlPluralRulesOracle {
    public static void main(String[] args) throws Exception {
        List<String> rows = new ArrayList<>();
        rows.add("locale\ttype\tvalue\tcategory");
        // These values already fit Intl's default maximum of three fraction
        // digits, so the direct ICU APIs receive identical rounded operands.
        String[] values = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "19", "20", "21", "100", "101", "102", "1000", "0.1", "1.1", "2.1", "1.001", "1.01", "1.101", "-1", "-2", "-1.1", "-0.1"};
        for (String tag : new String[]{"en", "fr", "ar", "ru", "pl", "cs", "sl", "lt", "lv", "he", "ja", "zh-TW"}) {
            for (PluralRules.PluralType type : PluralRules.PluralType.values()) {
                PluralRules rules = PluralRules.forLocale(ULocale.forLanguageTag(tag), type);
                String name = type == PluralRules.PluralType.CARDINAL ? "cardinal" : "ordinal";
                LocalizedNumberFormatter formatter = NumberFormatter.withLocale(ULocale.forLanguageTag(tag))
                    .precision(Precision.minMaxFraction(0, 3)).roundingMode(RoundingMode.HALF_UP);
                for (String value : values)
                    rows.add(tag + "\t" + name + "\t" + value + "\t" + rules.select(formatter.format(Double.parseDouble(value))));
            }
        }
        if (rows.size() != 721) throw new AssertionError("Incomplete plural matrix");
        Files.write(Paths.get(args[0]), rows, StandardCharsets.UTF_8);
    }
}
