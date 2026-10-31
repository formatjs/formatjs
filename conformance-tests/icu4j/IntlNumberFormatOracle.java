import com.ibm.icu.number.*;
import com.ibm.icu.text.ConstrainedFieldPosition;
import com.ibm.icu.text.FormattedValue;
import com.ibm.icu.text.NumberFormat;
import com.ibm.icu.text.NumberingSystem;
import com.ibm.icu.util.ULocale;
import com.ibm.icu.util.VersionInfo;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.LinkedHashSet;

public final class IntlNumberFormatOracle {
    record Profile(String options, String skeleton) {}
    static final List<Profile> PROFILES = new ArrayList<>(List.of(
        new Profile("{}", ".###"),
        new Profile("{\"style\":\"percent\"}", "percent scale/100 precision-integer"),
        new Profile("{\"style\":\"currency\",\"currency\":\"USD\"}", "currency/USD precision-currency-standard"),
        new Profile("{\"style\":\"currency\",\"currency\":\"JPY\"}", "currency/JPY precision-currency-standard"),
        new Profile("{\"style\":\"currency\",\"currency\":\"BHD\"}", "currency/BHD precision-currency-standard"),
        new Profile("{\"style\":\"currency\",\"currency\":\"CHF\",\"currencyDisplay\":\"code\"}", "currency/CHF unit-width-iso-code precision-currency-standard"),
        new Profile("{\"style\":\"currency\",\"currency\":\"USD\",\"currencyDisplay\":\"name\"}", "currency/USD unit-width-full-name precision-currency-standard"),
        new Profile("{\"style\":\"currency\",\"currency\":\"USD\",\"currencySign\":\"accounting\"}", "currency/USD sign-accounting precision-currency-standard"),
        new Profile("{\"style\":\"unit\",\"unit\":\"meter\",\"unitDisplay\":\"long\"}", "measure-unit/length-meter unit-width-full-name .###"),
        new Profile("{\"style\":\"unit\",\"unit\":\"kilometer-per-hour\"}", "measure-unit/length-kilometer per-measure-unit/duration-hour unit-width-short .###"),
        new Profile("{\"notation\":\"compact\"}", "compact-short group-min2"),
        new Profile("{\"notation\":\"compact\",\"compactDisplay\":\"long\"}", "compact-long group-min2"),
        new Profile("{\"style\":\"currency\",\"currency\":\"USD\",\"notation\":\"compact\"}", "currency/USD compact-short group-min2"),
        new Profile("{\"notation\":\"scientific\"}", "scientific .###"),
        new Profile("{\"notation\":\"engineering\"}", "engineering .###"),
        new Profile("{\"minimumFractionDigits\":2,\"maximumFractionDigits\":2,\"roundingIncrement\":5}", "precision-increment/0.05"),
        new Profile("{\"minimumFractionDigits\":2,\"trailingZeroDisplay\":\"stripIfInteger\"}", ".00#/w"),
        new Profile("{\"maximumSignificantDigits\":3}", "@##"),
        new Profile("{\"maximumFractionDigits\":1,\"maximumSignificantDigits\":3,\"roundingPriority\":\"morePrecision\"}", ".#/@##r"),
        new Profile("{\"maximumFractionDigits\":1,\"maximumSignificantDigits\":3,\"roundingPriority\":\"lessPrecision\"}", ".#/@##s"),
        new Profile("{\"useGrouping\":false}", "group-off .###"),
        new Profile("{\"useGrouping\":\"always\"}", "group-on-aligned .###"),
        new Profile("{\"useGrouping\":\"min2\"}", "group-min2 .###"),
        new Profile("{\"signDisplay\":\"always\"}", "sign-always .###"),
        new Profile("{\"signDisplay\":\"exceptZero\"}", "sign-except-zero .###"),
        new Profile("{\"signDisplay\":\"negative\"}", "sign-negative .###"),
        new Profile("{\"notation\":\"compact\",\"maximumSignificantDigits\":3}", "compact-short @## group-min2"),
        new Profile("{\"style\":\"unit\",\"unit\":\"meter\",\"unitDisplay\":\"long\",\"minimumFractionDigits\":2,\"trailingZeroDisplay\":\"stripIfInteger\"}", "measure-unit/length-meter unit-width-full-name .00#/w"),
        new Profile("{\"style\":\"currency\",\"currency\":\"USD\",\"currencyDisplay\":\"name\",\"trailingZeroDisplay\":\"stripIfInteger\"}", "currency/USD unit-width-full-name .00/w")
    ));
    static int excluded = 0;
    static final String[] VALUES = {"0", "-0", "1", "2", "-1", "1.025", "-1.025", "1234.5", "999.5", "999999.5", "0.0000001", "1e21", "1e100", "9007199254740993.125", "NaN", "Infinity", "-Infinity"};
    static final String[][] RANGES = {{"1","2"},{"-2","-1"},{"-1","1"},{"1.0001","1.0002"},{"1","1"},{"-0","0"},{"999.5","1000.5"},{"1234","5678"}};
    static Number number(String s) {
        if (s.equals("-0") || s.equals("NaN") || s.endsWith("Infinity")) return Double.valueOf(s);
        return new BigDecimal(s);
    }
    static String json(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\t", "\\t").replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }
    static String kind(Object field, String value, boolean special) {
        if (field == NumberFormat.Field.INTEGER) return special ? value.contains("∞") ? "infinity" : "nan" : "integer";
        if (field == NumberFormat.Field.FRACTION) return "fraction";
        if (field == NumberFormat.Field.DECIMAL_SEPARATOR) return "decimal";
        if (field == NumberFormat.Field.GROUPING_SEPARATOR) return "group";
        if (field == NumberFormat.Field.SIGN) return "sign";
        if (field == NumberFormat.Field.PERCENT) return "percentSign";
        if (field == NumberFormat.Field.CURRENCY) return "currency";
        if (field == NumberFormat.Field.MEASURE_UNIT) return "unit";
        if (field == NumberFormat.Field.COMPACT) return "compact";
        if (field == NumberFormat.Field.EXPONENT) return "exponentInteger";
        if (field == NumberFormat.Field.EXPONENT_SIGN) return "exponentMinusSign";
        if (field == NumberFormat.Field.EXPONENT_SYMBOL) return "exponentSeparator";
        if (field == NumberFormat.Field.APPROXIMATELY_SIGN) return "approximatelySign";
        throw new AssertionError("Unmapped ICU field " + field);
    }
    static String parts(FormattedValue value, String start, String end) {
        String text = value.toString();
        String[] kinds = new String[text.length()], sources = new String[text.length()];
        int[] priorities = new int[text.length()];
        Arrays.fill(kinds, "literal");
        Arrays.fill(sources, "shared");
        ConstrainedFieldPosition position = new ConstrainedFieldPosition();
        while (value.nextPosition(position)) {
            if (position.getField() == NumberRangeFormatter.SpanField.NUMBER_RANGE_SPAN) {
                Arrays.fill(sources, position.getStart(), position.getLimit(), position.getFieldValue().equals(0) ? "startRange" : "endRange");
                continue;
            }
            String fragment = text.substring(position.getStart(), position.getLimit());
            boolean special = start.equals("NaN") || start.endsWith("Infinity");
            String kind = kind(position.getField(), fragment, special);
            int priority = kind.equals("integer") ? 1 : 2;
            for (int i = position.getStart(); i < position.getLimit(); i++) {
                if (priority >= priorities[i]) { kinds[i] = kind; priorities[i] = priority; }
            }
        }
        List<String> parts = new ArrayList<>();
        for (int i = 0; i < text.length();) {
            int j = i + 1;
            while (j < text.length() && kinds[j].equals(kinds[i]) && sources[j].equals(sources[i])) j++;
            String type = kinds[i];
            if (type.equals("sign")) type = (sources[i].equals("endRange") ? end : start).startsWith("-") ? "minusSign" : "plusSign";
            parts.add("{\"type\":" + json(type) + ",\"value\":" + json(text.substring(i, j)) + (end.isEmpty() ? "" : ",\"source\":" + json(sources[i])) + "}");
            i = j;
        }
        return "[" + String.join(",", parts) + "]";
    }
    static void rows(List<String> rows, String locale, Profile profile, boolean ranges) {
        rows(rows, locale, profile, ranges, VALUES);
    }
    static void rows(List<String> rows, String locale, Profile profile, boolean ranges, String[] values) {
        String skeleton = profile.skeleton + " rounding-mode-half-up";
        LocalizedNumberFormatter formatter = NumberFormatter.forSkeleton(skeleton).locale(ULocale.forLanguageTag(locale));
        for (String input : values) {
            // ICU4J 79 reverses surrogate halves in multi-digit scientific exponents.
            // Keep these out of the oracle; the audit records this upstream defect.
            if (profile.skeleton.contains("scientific")
                && NumberingSystem.getInstance(ULocale.forLanguageTag(locale)).getDescription().codePointAt(0) > 0xffff
                && number(input) instanceof BigDecimal decimal
                && Math.abs(decimal.precision() - decimal.scale() - 1) >= 10) { excluded++; continue; }
            FormattedNumber formatted = formatter.format(number(input));
            rows.add(String.join("\t", locale, profile.options, skeleton, input, "", formatted.toString(), parts(formatted, input, "")));
        }
        if (!ranges) return;
        var range = NumberRangeFormatter.withLocale(ULocale.forLanguageTag(locale))
            .numberFormatterBoth(NumberFormatter.forSkeleton(skeleton))
            .collapse(NumberRangeFormatter.RangeCollapse.AUTO)
            .identityFallback(NumberRangeFormatter.RangeIdentityFallback.APPROXIMATELY);
        for (String[] pair : RANGES) {
            // ECMA-402 compares formatted strings, including hidden signs on zero.
            Number end = formatter.format(number(pair[0])).toString().equals(formatter.format(number(pair[1])).toString()) ? number(pair[0]) : number(pair[1]);
            FormattedNumberRange formatted = range.formatRange(number(pair[0]), end);
            rows.add(String.join("\t", locale, profile.options, skeleton, pair[0], pair[1], formatted.toString(), parts(formatted, pair[0], pair[1])));
        }
    }
    public static void main(String[] args) throws Exception {
        if (VersionInfo.ICU_VERSION.getMajor() != 79) throw new AssertionError("ICU 79 required");
        List<String> rows = new ArrayList<>();
        rows.add("locale\toptions\tskeleton\tstart\tend\ttext\tparts");
        for (String locale : new String[]{"en","fr","de","ar","hi","bn","ja","zh-Hant","pl","ru","cs","he","fa","se-FI","sw","ca","de-CH"})
            for (Profile profile : PROFILES) rows(rows, locale, profile, true);
        for (String name : NumberingSystem.getAvailableNames()) {
            if (NumberingSystem.getInstanceByName(name).isAlgorithmic()) continue;
            for (int i : new int[]{0, 10, 13}) rows(rows, "en-u-nu-" + name, PROFILES.get(i), false);
        }
        String[] modes = {"ceiling","floor","up","down","half-up","half-down","half-even"};
        String[] ecma = {"ceil","floor","expand","trunc","halfExpand","halfTrunc","halfEven"};
        for (int i = 0; i < modes.length; i++) {
            Profile profile = new Profile("{\"maximumFractionDigits\":2,\"roundingMode\":" + json(ecma[i]) + "}", ".## rounding-mode-" + modes[i]);
            // rows() supplies the ECMA default mode, so emit explicit-mode rows here.
            var formatter = NumberFormatter.forSkeleton(profile.skeleton).locale(ULocale.ENGLISH);
            for (String input : new String[]{"1.005","-1.005","1.015","-1.015","0.001","-0.001"}) {
                var formatted = formatter.format(number(input));
                rows.add(String.join("\t", "en", profile.options, profile.skeleton, input, "", formatted.toString(), parts(formatted, input, "")));
            }
        }
        for (int i = 1; i < args.length; i++)
            for (int profile : new int[]{0,1,2,8,10,13})
                rows(rows, args[i], PROFILES.get(profile), false, new String[]{"0","1","-1.25","12345.678","999999.5"});
        rows = new ArrayList<>(new LinkedHashSet<>(rows));
        if (rows.size() < 14000) throw new AssertionError("Incomplete NumberFormat matrix: " + rows.size());
        for (String row : rows) {
            if (!StandardCharsets.UTF_8.newEncoder().canEncode(row)) {
                String[] fields = row.split("\\t", -1);
                throw new AssertionError("Invalid UTF-16: " + fields[0] + " " + fields[1] + " " + fields[3] + " text=" + fields[5].codePoints().mapToObj(Integer::toHexString).toList() + " parts=" + fields[6].codePoints().mapToObj(Integer::toHexString).toList());
            }
        }
        Files.write(Path.of(args[0]), rows, StandardCharsets.UTF_8);
        System.out.println((rows.size() - 1) + " ICU 79 NumberFormat fixtures; " + (args.length - 1) + " data locales; " + excluded + " upstream UTF-16 exclusions");
    }
}
