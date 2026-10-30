import com.ibm.icu.text.PluralRules;
import com.ibm.icu.number.NumberFormatter;
import com.ibm.icu.number.NumberRangeFormatter;
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
        if (args.length == 2 && args[1].equals("--ranges")) {
            ranges(args[0]);
            return;
        }
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
    private static void ranges(String output) throws Exception {
        List<String> rows = new ArrayList<>();
        rows.add("locale\tstart\tend\ticu4cJRaw\ticu4cJIdentity");
        String[][] pairs = {{"0","1"},{"1","2"},{"2","3"},{"3","5"},{"1","1"},{"2","2"},{"0","0"},{"1","1.001"},{"1.001","2.1"},{"2.1","5"},{"-3","-1"},{"10","20"},{"21","101"},{"1.1","2.1"},{"2","1"},{"0.1","0.2"}};
        for (String tag : new String[]{"en","fr","ar","ru","pl","cs","sl","lt","lv","he","ja","zh-TW","zh-HK","zh-Hant-HK"}) {
            ULocale locale = ULocale.forLanguageTag(tag);
            PluralRules rules = PluralRules.forLocale(locale, PluralRules.PluralType.CARDINAL);
            var formatter = NumberRangeFormatter.withLocale(locale)
                .numberFormatterBoth(NumberFormatter.with().precision(Precision.minMaxFraction(0, 3)).roundingMode(RoundingMode.HALF_UP))
                .identityFallback(NumberRangeFormatter.RangeIdentityFallback.SINGLE_VALUE);
            var single = NumberFormatter.withLocale(locale)
                .precision(Precision.minMaxFraction(0, 3)).roundingMode(RoundingMode.HALF_UP);
            for (String[] pair : pairs) {
                String raw = rules.select(formatter.formatRange(Double.parseDouble(pair[0]), Double.parseDouble(pair[1])));
                // ECMA-402 short-circuits equal formatted values before range resolution.
                String ecma = pair[0].equals(pair[1]) ? rules.select(single.format(Double.parseDouble(pair[0]))) : raw;
                rows.add(tag + "\t" + pair[0] + "\t" + pair[1] + "\t" + raw + "\t" + ecma);
            }
        }
        if (rows.size() != 225) throw new AssertionError("Incomplete plural range matrix");
        Files.write(Paths.get(output), rows, StandardCharsets.UTF_8);
    }

}
