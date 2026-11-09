import com.ibm.icu.text.MessageFormat;
import com.ibm.icu.text.MessagePattern;
import com.ibm.icu.util.ULocale;
import com.ibm.icu.util.VersionInfo;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class MessageFormatEscapeOracle {
    private static String format(String pattern, double n, String g) {
        MessageFormat formatter = new MessageFormat("", ULocale.ENGLISH);
        formatter.applyPattern(pattern, MessagePattern.ApostropheMode.DOUBLE_OPTIONAL);
        Map<String, Object> values = Map.of(
            "0", 3, "1", "x", "2", "Y", "n", n, "g", g, "x", "X", "name", "Ada"
        );
        return formatter.format(values);
    }

    public static void main(String[] args) throws Exception {
        if (VersionInfo.ICU_VERSION.getMajor() != 78 || VersionInfo.ICU_VERSION.getMinor() != 1)
            throw new AssertionError("ICU4J 78.1 required");
        if (args.length == 2 && args[0].equals("--verify")) {
            List<String> rows = Files.readAllLines(Path.of(args[1]), StandardCharsets.UTF_8);
            for (String row : rows.subList(1, rows.size())) {
                String[] fields = row.split("\t", -1);
                String actual = outcome(fields[3], Double.parseDouble(fields[1]), fields[2]);
                if (!actual.equals(fields[4])) throw new AssertionError("ICU4J mismatch: " + row + "; got " + actual);
            }
            System.out.println((rows.size() - 1) + " ICU4J escape cases verified");
            return;
        }

        // ICU 78.1 MessagePatternUtilTest and tmsgfmt.cpp apostrophe regressions.
        Map<String, String> upstream = new LinkedHashMap<>();
        upstream.put("Hel'lo!", "Hel'lo!");
        upstream.put("Hel'{o!", "Hel{o!");
        upstream.put("Hel'{'o!", "Hel{o!");
        upstream.put("a'{bc''de'f", "a{bc'def");
        upstream.put("I see '{many}'", "I see {many}");
        upstream.put("I said '{''Wow!''}'", "I said {'Wow!'}");
        upstream.put("I dont know", "I dont know");
        upstream.put("I don't know", "I don't know");
        upstream.put("I don''t know", "I don't know");
        upstream.put("abc_{0,plural,other{#'#'#'{'#''}}_def_{1,select,other{sel'}'ect''}}_xyz", "abc_3#3{3'_def_sel}ect'_xyz");
        upstream.put("Double '' Quotes {0} test and quoted '{1}' test plus 'other {2} stuff'.", "Double ' Quotes 3 test and quoted {1} test plus 'other Y stuff'.");
        for (var entry : upstream.entrySet()) {
            String actual = format(entry.getKey(), 3, "other");
            if (!actual.equals(entry.getValue())) throw new AssertionError("Upstream regression: " + entry + "; got " + actual);
        }

        List<String> patterns = new ArrayList<>(upstream.keySet());
        patterns.addAll(List.of(
            "a''''{x}", "{x}'{name}", "a'{b''''c}'{x}", "Use '}}' to close",
            "Use '}''}' to close", "'{x}", "'{x}''", "tail'", "'{x}'tail'",
            "''{x}''", "'''{x}'''", "''''{x}''''", "😀'{é''文}'{x}",
            "{n, plural, offset:1 =0 {'{none}'} one {'#' #} other {# '' items}}",
            "{n, selectordinal, one {#'st'} two {#'nd'} few {#'rd'} other {#'th'}}",
            "{n, selectordinal, one {'#'st #} two {'#'nd #} few {'#'rd #} other {'#'th #}}",
            "{g, select, female {{n, plural, one {'{one}'} other {# '#' ''}}} other {'{other}''s'}}",
            "{n, plural, other {{x}'#'#'{'#'}'}}",
            "{g, select, other {don't '' '{x}'}}", "literal <3 > # }"
        ));
        patterns.addAll(List.of(
            "{n, plural, one {# file in {0, plural, one {# folder} other {# folders}}} other {# files in {0, plural, one {# folder} other {# folders}}}}",
            "{n, plural, one {# photo liked by {g, select, female {her} other {them}}} other {# photos liked by {g, select, female {her} other {them}}}}",
            "{n, plural, offset:1 =0 {Nobody} one {You and # other} other {You and # others}} joined {g, select, female {her} other {their}} party",
            "{n, plural, offset:2 other {# outer}} then {0, plural, other {# inner}}",
            "{n, plural, other {{0, plural, other {# inner}} # outer}} {g, select, female {her} other {them}}",
            "{n, plural, offset:1 other {# outer {n, plural, offset:2 other {# inner}} # outer}}",
            "{n, selectordinal, other {# outer {0, plural, other {# inner}} # outer}}",
            "{n, plural, offset:1 other {{g, select, female {her} other {them}} # outer}}"
        ));
        String[] fragments = {"a", "'", "''", "''''", "'{x}'", "'}'", "'#'", "#", "{x}"};
        for (String left : fragments) {
            for (String right : fragments) {
                String body = left + right;
                patterns.add(body);
                patterns.add("{g, select, other {" + body + "}}");
                patterns.add("{n, plural, other {" + body + "}}");
            }
        }
        List<String> rows = new ArrayList<>();
        rows.add("case\tn\tg\tpattern\texpected");
        for (int i = 0; i < patterns.size(); i++) {
            for (double n : new double[] {-1.5, -1, 0, 0.5, 1, 1.5, 2, 3, 5, 11}) {
                for (String g : new String[] {"female", "other"}) {
                    String pattern = patterns.get(i);
                    rows.add(i + "\t" + n + "\t" + g + "\t" + pattern + "\t" + outcome(pattern, n, g));
                }
            }
        }
        String[] keyPatterns = {
            "{g,select,__proto__{P} constructor{C} other{O}}",
            "{n,plural,offset:1 other{# {g,select,__proto__{P} constructor{C} other{O}}}}",
            "{n,plural,other{# {g,select,__proto__{P} constructor{C} other{O}}}}"
        };
        for (int i = 0; i < keyPatterns.length; i++) {
            for (String g : new String[] {"__proto__", "constructor", "toString"}) {
                rows.add("key-" + i + "\t3\t" + g + "\t" + keyPatterns[i] + "\t" + format(keyPatterns[i], 3, g));
            }
        }
        Files.write(Path.of(args[0]), rows, StandardCharsets.UTF_8);
        System.out.println((rows.size() - 1) + " ICU4J escape fixtures");
    }

    private static String outcome(String pattern, double n, String g) {
        try {
            return format(pattern, n, g);
        } catch (IllegalArgumentException error) {
            return "!PARSE_ERROR";
        }
    }
}
