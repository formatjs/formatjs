import com.ibm.icu.text.ListFormatter;
import com.ibm.icu.util.ULocale;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

public class IntlListFormatOracle {
    private static String hex(String value) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < value.length(); i++) out.append(String.format("%04x", (int) value.charAt(i)));
        return out.length() == 0 ? "_" : out.toString();
    }

    public static void main(String[] args) throws Exception {
        Map<String, String[]> differences = new HashMap<>();
        List<String> differenceRows = Files.readAllLines(Paths.get(args[1]), StandardCharsets.UTF_8);
        for (String row : differenceRows.subList(1, differenceRows.size())) {
            String[] fields = row.split("\t", -1);
            if (fields.length != 6) throw new AssertionError("Invalid oracle difference");
            String key = String.join("\t", java.util.Arrays.copyOf(fields, 4));
            if (differences.put(key, fields) != null) throw new AssertionError("Duplicate oracle difference");
        }
        int used = 0;
        List<String> rows = new ArrayList<>();
        rows.add("locale\ttype\tstyle\titems\ticu4j\ticu4c");
        String[][] inputs = {
            {}, {""}, {"A", "B"}, {"one", "two", "three"}, {"", "x", ""},
            {"\ud800", "\ud83d\udca9", "\udfff"},
            {"España", "Italia"}, {"7", "8"}, {"A", "B", "C", "D", "E"},
            {"x", "i"}, {"x", "hi"}, {"x", "hijo"}, {"x", "HIAto"}, {"x", "hIElo"},
            {"x", "ocho"}, {"x", "HOja"}, {"x", "11"}, {"x", "11 horas"},
            {"x", "110"}, {"x", "11\n"}, {"x", " Italia"},
            {"x", "א"}, {"x", "\u05be"}, {"x", "\ufb1d"}, {"x", "\ufb29"},
            {"x", "\u0590"}, {"x", "\u05ff"}, {"x", "y", "Italia"}, {"x", "y", "8"}
        };
        String[] types = {"conjunction", "disjunction", "unit"};
        ListFormatter.Type[] nativeTypes = {ListFormatter.Type.AND, ListFormatter.Type.OR, ListFormatter.Type.UNITS};
        String[] styles = {"long", "short", "narrow"};
        ListFormatter.Width[] widths = {ListFormatter.Width.WIDE, ListFormatter.Width.SHORT, ListFormatter.Width.NARROW};
        for (String tag : new String[]{"en", "en-GB", "fr", "de", "es", "he", "zh-TW", "zh-HK", "ja", "ar", "ru"}) {
            ULocale locale = ULocale.forLanguageTag(tag);
            for (int t = 0; t < types.length; t++) {
                for (int w = 0; w < styles.length; w++) {
                    ListFormatter formatter = ListFormatter.getInstance(locale, nativeTypes[t], widths[w]);
                    List<String[]> cases = new ArrayList<>(java.util.Arrays.asList(inputs));
                    for (int size : new int[]{16, 32, 256}) {
                        String[] large = new String[size];
                        for (int index = 0; index < size; index++) large[index] = index % 3 == 0 ? "" : "item" + index;
                        cases.add(large);
                    }
                    for (String[] input : cases) {
                        List<String> items = new ArrayList<>();
                        for (String item : input) items.add(hex(item));
                        String key = tag + "\t" + types[t] + "\t" + styles[w] + "\t"
                            + (items.isEmpty() ? "-" : String.join(",", items));
                        String result = hex(formatter.format((Object[]) input));
                        String expectedC = result;
                        String[] difference = differences.get(key);
                        if (difference != null) {
                            if (!result.equals(difference[4])) throw new AssertionError("ICU4J difference changed: " + key);
                            expectedC = difference[5];
                            used++;
                        }
                        rows.add(key + "\t" + result + "\t" + expectedC);
                    }
                }
            }
        }
        if (used != differences.size()) throw new AssertionError("Unused oracle differences");
        if (rows.size() != 3169) throw new AssertionError("Incomplete list matrix");
        Files.write(Paths.get(args[0]), rows, StandardCharsets.UTF_8);
    }
}
